require("dotenv").config();
const cron = require("node-cron");
const mongoose = require("mongoose");
const VideoInfo = require("../models/").courseVideoInfo;
const QAmessage = require("../models/").QAmessage;
const vimeoSchedule = require("../models").vimeoSchedule;
const VimeoMethods = require("../methods").vimeoMethods;

/** processExpiredVideos：處理過期影片排程 */
async function processExpiredVideos() {
  const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 檢查 VideoInfo 是否有需要處理的資料
  const countVideo = await VideoInfo.countDocuments({
    isUploadSuccess: false,
    date: { $lte: expiredTime },
  });
  if (countVideo > 0) {
    let cursor = VideoInfo.find({
      isUploadSuccess: false,
      date: { $lte: expiredTime },
    }).cursor();
    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      try {
        const newSchedule = new vimeoSchedule({
          method: "delete",
          videoIndex: { videoid: doc._id },
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

  // 檢查 QAmessage 是否有需要處理的資料
  const countQA = await QAmessage.countDocuments({
    isUploadSuccess: false,
    date: { $lte: expiredTime },
  });
  if (countQA > 0) {
    let cursorQA = QAmessage.find({
      isUploadSuccess: false,
      date: { $lte: expiredTime },
    }).cursor();
    for (
      let doc = await cursorQA.next();
      doc != null;
      doc = await cursorQA.next()
    ) {
      try {
        const newSchedule = new vimeoSchedule({
          method: "delete",
          videoIndex: { commentid: doc._id },
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
 * processGetSchedule：處理 method 為 "get" 的排程記錄
 * - 每3分鐘執行一次，依 date 由舊到新排序
 * - 不取得初始 /me 狀態，直接開始處理
 * - 若 VimeoMethods.find 回傳 success 為 false，則印出該記錄的 videoIndex 與 method，並更新 failedCount
 *   若 failedCount 更新後達到 5 次，則刪除該記錄；否則繼續處理下一筆
 * - 若處理過程中剩餘點數低於 APILimit.limit 的 2/3，則中斷本輪處理
 * - 成功更新 target 文件後，刪除該排程記錄
 */
async function processGetSchedule() {
  const count = await vimeoSchedule.countDocuments({ method: "get" });
  if (count === 0) {
    return { success: true, processed: 0, APILimit: {} };
  }
  const schedules = await vimeoSchedule
    .find({ method: "get" })
    .sort({ date: 1 });
  let APILimit = {};

  for (const schedule of schedules) {
    // 若 videoIndex 為空則跳過
    if (!schedule.videoIndex || schedule.videoIndex.size === 0) continue;
    // 呼叫 VimeoMethods.find，直接傳入資料庫中的 videoIndex
    const plainSchedule = schedule.toObject();
    const videoIndexObj = Object.fromEntries(plainSchedule.videoIndex);
    const findResp = await VimeoMethods.find(videoIndexObj);
    // 若回傳 success 為 false，則印出該記錄資訊並更新 failedCount
    if (!findResp.success || findResp.total === 0) {
      console.log(
        `GET 排程失敗：method: ${schedule.method}, videoIndex: ${JSON.stringify(
          Object.fromEntries(schedule.videoIndex)
        )}`
      );
      // 更新 failedCount
      schedule.failedCount = (schedule.failedCount || 0) + 1;
      if (schedule.failedCount >= 5) {
        await vimeoSchedule.findByIdAndDelete(schedule._id);
        console.log(`GET 排程：失敗次數達到上限，已刪除 _id: ${schedule._id}`);
      } else {
        await schedule.save();
        console.log(`GET 排程：failedCount 更新為 ${schedule.failedCount}`);
      }
      // 若 API 回傳失敗則跳過本輪處理
      return { success: false, processed: 0, APILimit: findResp.APILimit };
    }
    if (findResp.data && findResp.data.length > 0) {
      const videoData = findResp.data[0];
      if (videoData && videoData.uri) {
        const targetSchema = schedule.takeTo.schema;
        const targetId = schedule.takeTo.id;
        const targetKey = schedule.takeTo.key;

        let targetModel;
        try {
          targetModel = mongoose.model(targetSchema);
        } catch (e) {
          console.error("找不到目標模型：", targetSchema);
          continue;
        }
        await targetModel.findByIdAndUpdate(targetId, {
          [targetKey]: videoData.player_embed_url,
          isUploadSuccess: true,
        });
        await vimeoSchedule.findByIdAndDelete(schedule._id);
        console.log(`GET 排程：成功處理並刪除 _id: ${schedule._id}`);
      }
    }
    if (findResp.APILimit) {
      APILimit = findResp.APILimit;
      if (APILimit.remaining < (APILimit.limit * 2) / 3) {
        console.log("GET 排程：剩餘點數低於總額的 2/3，結束本輪處理");
        break;
      }
    }
  }
  return { success: true, processed: schedules.length, APILimit };
}

/**
 * processDeleteSchedule：處理 method 為 "delete" 的排程記錄
 * - 僅在凌晨 03:30 ~ 05:00 執行（由外部 cron 控制）
 * - 每3分鐘執行一次，依 date 由舊到新排序
 * - 不取得初始 /me 狀態，直接開始處理
 * - 若 VimeoMethods.delete 回傳 success 為 false，則印出該記錄資訊並更新 failedCount
 *   若 failedCount 更新後達到 5 次，則刪除該記錄；否則繼續處理下一筆
 * - 若處理過程中剩餘點數低於 APILimit.limit 的 1/2，則中斷本輪處理
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
    // 若 DELETE API 回傳 success 為 false
    if (deleteResp.data && deleteResp.data.success === false) {
      console.log(
        `DELETE 排程失敗：method: ${
          schedule.method
        }, videoIndex: ${JSON.stringify(
          Object.fromEntries(schedule.videoIndex)
        )}`
      );
      schedule.failedCount = (schedule.failedCount || 0) + 1;
      if (schedule.failedCount >= 5) {
        await vimeoSchedule.findByIdAndDelete(schedule._id);
        console.log(
          `DELETE 排程：失敗次數達到上限，已刪除 _id: ${schedule._id}`
        );
      } else {
        await schedule.save();
        console.log(`DELETE 排程：failedCount 更新為 ${schedule.failedCount}`);
      }
      return { success: false, processed: 0, APILimit: deleteResp.APILimit };
    }
    if (deleteResp.data && deleteResp.data.success) {
      await vimeoSchedule.findByIdAndDelete(schedule._id);
      console.log(`DELETE 排程：成功處理並刪除 _id: ${schedule._id}`);
    }
    if (deleteResp.APILimit) {
      APILimit = deleteResp.APILimit;
      if (APILimit.remaining < (APILimit.limit * 1) / 2) {
        console.log("DELETE 排程：剩餘點數低於總額的一半，結束本輪處理");
        break;
      }
    }
  }
  return { success: true, processed: schedules.length, APILimit };
}

/** 排程設定 */

// 過期影片清理排程：每天 16:06 執行
cron.schedule(
  "06 16 * * *",
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

// GET 排程：每3分鐘執行一次（全日皆可）
cron.schedule(
  "*/3 * * * *",
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

// DELETE 排程：每3分鐘執行一次，但僅在凌晨 03:30 ~ 05:00 執行
cron.schedule(
  "*/3 * * * *",
  async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if ((hour === 3 && minute < 30) || hour >= 5) {
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
