/**
 * @file cleanUpDataBase.js
 * @description 資料庫清理和影片排程處理工具，包含過期影片處理和 Vimeo 排程任務
 * @author StudyWeb Team
 * @date 2024-03-30
 */

require("dotenv").config();
const cron = require("node-cron");
const mongoose = require("mongoose");
const path = require("path");
const VideoInfo = require("../models/").courseVideoInfo;
const QAmessage = require("../models/").QAmessage;
const vimeoSchedule = require("../models").vimeoSchedule;
const VimeoMethods = require("../methods").vimeoMethods;

// 讀取config
const scheduleConfig = require("../config/scheduleConfig.json");

// 解析時間字串
function parseTimeString(timeStr) {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1));

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`不支持的时间单位: ${unit}`);
  }
}

/**
 * 處理過期影片排程
 * 檢查並處理 VideoInfo 和 QAmessage 中超過 24 小時未上傳成功的記錄
 * @returns {Promise<void>}
 */
async function processExpiredVideos() {
  // 從配置文件獲取過期時間
  const expireTime = new Date(
    Date.now() - parseTimeString(scheduleConfig.expiredVideos.expireTime)
  );

  // 步驟 1: 處理 VideoInfo 過期記錄
  const countVideo = await VideoInfo.countDocuments({
    isUploadSuccess: false,
    date: { $lte: expireTime },
  });
  if (countVideo > 0) {
    let cursor = VideoInfo.find({
      isUploadSuccess: false,
      date: { $lte: expireTime },
    }).cursor();
    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      try {
        // 創建刪除排程
        const newSchedule = new vimeoSchedule({
          method: "delete",
          videoIndex: {
            courseID: doc.courseID.toString(),
            videoId: doc._id.toString(),
          },
        });
        await newSchedule.save();
        await VideoInfo.findByIdAndDelete(doc._id);
        console.log(`將 VideoInfo_id: ${doc._id} 轉移到待刪除影片`);
      } catch (err) {
        console.error(`轉移失敗，VideoInfo_id: ${doc._id}`, err);
      }
    }
  } else {
    console.log("VideoInfo 無過期資料，跳過處理");
  }

  // 步驟 2: 處理 QAmessage 過期記錄
  const countQA = await QAmessage.countDocuments({
    isUploadSuccess: false,
    date: { $lte: expireTime },
  });
  if (countQA > 0) {
    let cursorQA = QAmessage.find({
      isUploadSuccess: false,
      date: { $lte: expireTime },
    }).cursor();
    for (
      let doc = await cursorQA.next();
      doc != null;
      doc = await cursorQA.next()
    ) {
      try {
        // 創建刪除排程
        const newSchedule = new vimeoSchedule({
          method: "delete",
          videoIndex: {
            questionID: doc.pointTo.toString(),
            commentID: doc._id.toString(),
          },
        });
        await newSchedule.save();
        await QAmessage.findByIdAndDelete(doc._id);
        console.log(`將 QAmessage_id: ${doc._id} 轉移到待刪除影片`);
      } catch (err) {
        console.error(`轉移失敗，QAmessage_id: ${doc._id}`, err);
      }
    }
  } else {
    console.log("QAmessage 無過期資料，跳過處理");
  }
}

/**
 * 處理 method 為 "get" 的排程記錄
 * @description
 * - 每3分鐘執行一次，依 date 由舊到新排序
 * - 不取得初始 /me 狀態，直接開始處理
 * - 若 VimeoMethods.find 回傳 success 為 false，則印出該記錄的 videoIndex 與 method，並更新 failedCount
 * - 若 failedCount 更新後達到 5 次，則刪除該記錄；否則繼續處理下一筆
 * - 若處理過程中剩餘點數低於 APILimit.limit 的 2/3，則中斷本輪處理
 * - 成功更新 target 文件後，刪除該排程記錄
 * @returns {Promise<{success: boolean, processed: number, APILimit: Object}>} 處理結果
 */
async function processGetSchedule() {
  // 檢查是否有待處理的排程
  const count = await vimeoSchedule.countDocuments({ method: "get" });
  if (count === 0) {
    return { success: true, processed: 0, APILimit: {} };
  }

  // 獲取所有待處理的排程
  const schedules = await vimeoSchedule
    .find({ method: "get" })
    .sort({ date: 1 });
  let APILimit = {};

  // 依序處理每個排程
  for (const schedule of schedules) {
    // 檢查 videoIndex 是否有效
    if (!schedule.videoIndex || schedule.videoIndex.size === 0) continue;

    // 轉換 videoIndex 格式並呼叫 Vimeo API
    const plainSchedule = schedule.toObject();
    const videoIndexObj = Object.fromEntries(plainSchedule.videoIndex);
    const findResp = await VimeoMethods.find(videoIndexObj);

    // 處理 API 回應失敗的情況
    if (!findResp.success || findResp.total === 0) {
      console.log(
        `GET 排程失敗：method: ${schedule.method}, videoIndex: ${JSON.stringify(
          Object.fromEntries(schedule.videoIndex)
        )}`
      );

      // 檢查是否因 API 限制而失败
      const shouldCountAsFail = !(
        (findResp.APILimit && findResp.APILimit.remaining === 0) || // API 限制
        (findResp.total !== undefined && findResp.total > 0)
      );

      if (shouldCountAsFail) {
        schedule.failedCount = (schedule.failedCount || 0) + 1;
        if (schedule.failedCount >= scheduleConfig.getSchedule.maxFailCount) {
          await vimeoSchedule.findByIdAndDelete(schedule._id);
          console.log(
            `GET 排程：失敗次數達到上限，已刪除 _id: ${schedule._id}`
          );
        } else {
          await schedule.save();
          console.log(`GET 排程：failedCount 更新為 ${schedule.failedCount}`);
        }
      } else {
        console.log("GET 排程：因 API 限制或有效響應而不計入失敗次數");
      }

      return { success: false, processed: 0, APILimit: findResp.APILimit };
    }

    // 處理成功找到影片的情況
    if (findResp.data && findResp.data.length > 0) {
      const videoData = findResp.data[0];
      if (videoData && videoData.uri) {
        const targetSchema = schedule.takeTo.schema;
        const targetId = schedule.takeTo.id;
        const targetKey = schedule.takeTo.key;

        // 更新目標文件
        let targetModel;
        try {
          targetModel = mongoose.model(targetSchema);
        } catch (e) {
          console.error("找不到目標模型：", targetSchema);
          continue;
        }
        // 如果是 QAmessage schema，使用 $push 操作符
        if (targetSchema === "QAmessage") {
          await targetModel.findByIdAndUpdate(targetId, {
            $push: { videoURL: videoData.player_embed_url },
            isUploadSuccess: true,
          });
        } else {
          await targetModel.findByIdAndUpdate(targetId, {
            [targetKey]: videoData.player_embed_url,
            isUploadSuccess: true,
          });
        }
        await vimeoSchedule.findByIdAndDelete(schedule._id);
        console.log(`GET 排程：成功處理並刪除 _id: ${schedule._id}`);
      }
    }

    // 檢查 API 限制
    if (findResp.APILimit) {
      APILimit = findResp.APILimit;
      if (
        APILimit.remaining <
        APILimit.limit * scheduleConfig.getSchedule.apiLimitThreshold
      ) {
        console.log(
          `GET 排程：剩餘點數低於總額的 ${
            scheduleConfig.getSchedule.apiLimitThreshold * 100
          }%，結束本輪處理`
        );
        break;
      }
    }
  }
  return { success: true, processed: schedules.length, APILimit };
}

/**
 * 處理 method 為 "delete" 的排程記錄
 * @description
 * - 僅在凌晨 03:30 ~ 05:00 執行（由外部 cron 控制）
 * - 每3分鐘執行一次，依 date 由舊到新排序
 * - 不取得初始 /me 狀態，直接開始處理
 * - 若 VimeoMethods.delete 回傳 success 為 false，則印出該記錄資訊並更新 failedCount
 * - 若 failedCount 更新後達到 5 次，則刪除該記錄；否則繼續處理下一筆
 * - 若處理過程中剩餘點數低於 APILimit.limit 的 1/2，則中斷本輪處理
 * @returns {Promise<{success: boolean, processed: number, APILimit: Object}>} 處理結果
 */
async function processDeleteSchedule() {
  const count = await vimeoSchedule.countDocuments({ method: "delete" });
  if (count === 0) {
    return { success: true, processed: 0, APILimit: {} };
  }

  const schedules = await vimeoSchedule
    .find({ method: "delete" })
    .sort({ date: 1 });
  let APILimit = {};

  for (const schedule of schedules) {
    if (!schedule.videoIndex || schedule.videoIndex.size === 0) continue;

    const plainSchedule = schedule.toObject();
    const videoIndexObj = Object.fromEntries(plainSchedule.videoIndex);
    const deleteResp = await VimeoMethods.delete(videoIndexObj);

    // 處理 API 回應失敗的情況
    if (
      (deleteResp.data && deleteResp.success === false) ||
      deleteResp.total === 0
    ) {
      console.log(
        `DELETE 排程失敗：method: ${
          schedule.method
        }, videoIndex: ${JSON.stringify(
          Object.fromEntries(schedule.videoIndex)
        )}`
      );

      // 檢查是否 API 限制而失败
      const shouldCountAsFail = !(
        (deleteResp.APILimit && deleteResp.APILimit.remaining === 0) || // API 限制
        (deleteResp.total !== undefined && deleteResp.total > 0)
      );

      if (shouldCountAsFail) {
        schedule.failedCount = (schedule.failedCount || 0) + 1;
        if (
          schedule.failedCount >= scheduleConfig.deleteSchedule.maxFailCount
        ) {
          await vimeoSchedule.findByIdAndDelete(schedule._id);
          console.log(
            `DELETE 排程：失敗次數達到上限，已刪除 _id: ${schedule._id}`
          );
        } else {
          await schedule.save();
          console.log(
            `DELETE 排程：failedCount 更新為 ${schedule.failedCount}`
          );
        }
      } else {
        console.log("DELETE 排程：因 API 限制或有效響應而不計入失敗次數");
      }

      return { success: false, processed: 0, APILimit: deleteResp.APILimit };
    }
    if (deleteResp.data && deleteResp.success === true) {
      await vimeoSchedule.findByIdAndDelete(schedule._id);
      console.log(`DELETE 排程：成功處理並刪除 _id: ${schedule._id}`);
    }
    if (deleteResp.APILimit) {
      APILimit = deleteResp.APILimit;
      if (
        APILimit.remaining <
        APILimit.limit * scheduleConfig.deleteSchedule.apiLimitThreshold
      ) {
        console.log(
          `DELETE 排程：剩餘點數低於總額的 ${
            scheduleConfig.deleteSchedule.apiLimitThreshold * 100
          }%，結束本輪處理`
        );
        break;
      }
    }
  }
  return { success: true, processed: schedules.length, APILimit };
}

/** 排程設定 */

// 過期影片清理排程
cron.schedule(
  scheduleConfig.expiredVideos.cronTime,
  async () => {
    console.log("開始執行過期影片清理排程...");
    try {
      await processExpiredVideos();
      console.log("過期影片清理排程執行完畢");
    } catch (err) {
      console.error("過期影片清理排程發生錯誤:", err);
    }
  },
  { timezone: "Asia/Taipei" }
);

// GET 排程
cron.schedule(
  scheduleConfig.getSchedule.cronTime,
  async () => {
    try {
      const result = await processGetSchedule();
      if (result.success && result.processed > 0) {
        console.log("GET 排程執行結果:", result);
      } else if (!result.success) {
        console.log("GET 排程因 API 回傳失敗而跳過本輪處理");
      }
    } catch (err) {
      console.error("GET 排程執行錯誤:", err);
    }
  },
  { timezone: "Asia/Taipei" }
);

// DELETE 排程
cron.schedule(
  scheduleConfig.deleteSchedule.cronTime,
  async () => {
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    // 檢查是否在允許時間
    if (
      currentTime < scheduleConfig.deleteSchedule.timeRange.start ||
      currentTime > scheduleConfig.deleteSchedule.timeRange.end
    ) {
      return;
    }

    try {
      const result = await processDeleteSchedule();
      if (result.success && result.processed > 0) {
        console.log("DELETE 排程執行結果:", result);
      } else if (!result.success) {
        console.log("DELETE 排程因 API 回傳失敗而跳過本輪處理");
      }
    } catch (err) {
      console.error("DELETE 排程執行錯誤:", err);
    }
  },
  { timezone: "Asia/Taipei" }
);

// 匯出供外部使用
module.exports = {
  processExpiredVideos,
  processGetSchedule,
  processDeleteSchedule,
};
