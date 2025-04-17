// serverIp/courseMethod/vimeoMigrate
/**
 * @file vimeoMigrate.js
 * @description 處理從 Vimeo 遷移影片的相關路由，包含批量創建影片資訊和更新影片 URL
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const vimeoSchedule = require("../../models").vimeoSchedule;
const VimeoMethods = require("../../methods").vimeoMethods;
const accessChecker = require("../routesMiddleware/accessChecker");
const fs = require("fs");
const path = require("path");
const vimeoConfig = require("../../config/vimeoConfig.json");
const { logError, log } = require("../../utils/logger");

router.use(accessChecker.admin);

/**
 * 批量創建影片資訊
 * @route POST /batchCreate
 * @param {Array} videos - 影片資訊陣列，每個物件包含 title、description、type、length(可選)、recordDate(可選)、isPrivate 等資訊
 * @returns {Object} 創建結果
 */
// 從使用者輸入獲得，res會回傳物件
// videos :{[{title、description、length(可選)、recordDate(可選)、isPrivate}]}
router.post("/batchCreate", accessChecker.teacher, async (req, res) => {
  try {
    const { videos } = req.body;

    // 驗證必要參數
    if (!Array.isArray(videos)) {
      return res.status(400).json({
        success: false,
        msg: "請提供正確的影片資訊陣列",
      });
    }

    // 批量創建影片資訊
    const createdVideos = await Promise.all(
      videos.map(async (video) => {
        const {
          title,
          description,
          type = "MainClass",
          length,
          recordDate,
          isPrivate,
          uid,
        } = video;

        // 建立新的影片資訊
        const videoInfo = new VideoInfo({
          title,
          courseID: req.course._id,
          type,
          description: description || "",
          length: length || 0,
          isPrivate: !!isPrivate,
          ...(recordDate && { recordDate }),
        });

        await videoInfo.save();
        let newObj = videoInfo;
        newObj.uid = uid;
        return newObj;
      })
    );

    const returnInfo = [];
    const videoIds = [];
    createdVideos.forEach((video) => {
      let videoObj = {};
      videoObj.title = video.title;
      videoObj.description =
        video.description +
        `;[VIDEOID]=${video._id};[COURSEID]=${video.courseID};[SUBJECT]=${req.course.subject};[GRADE]=${req.course.grade};[COURSECLASS]=${req.course.courseClass};`;
      if (vimeoConfig.version === "VimeoMethodsForFree") {
        videoObj.movePath = "library/Course";
      } else if (vimeoConfig.version === "VimeoMethodsForFreeV2") {
        videoObj.movePath = `library/COURSE:${req.course._id}`;
      } else if (vimeoConfig.version === "VimeoMethodsForFolders") {
        videoObj.movePath = `library/WebVideos/Course/COURSE:${video._id}`;
      }
      videoObj.uid = video.uid;

      returnInfo.push(videoObj);
      videoIds.push(video._id);
    });

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `批量創建 ${videos.length} 個影片資訊`
    );

    return res.json({
      success: true,
      data: { returnInfo, videoIds },
      msg: "已成功創建影片資訊",
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "vimeoMigrate.js",
      "batchCreate",
      `批量創建影片資訊失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "批量創建影片資訊時發生錯誤",
    });
  }
});

/**
 * 更新影片 URL
 * @route PATCH /updateUrls
 * @param {Array} videoIds - 要更新的影片 ID 陣列
 * @returns {Object} 更新結果
 */
router.patch("/updateUrls", accessChecker.teacher, async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds)) {
      return res.status(400).json({
        success: false,
        msg: "請提供正確的影片 ID 陣列",
      });
    }

    // 為每個影片創建更新排程
    const schedules = videoIds.map((videoId) => ({
      method: "get",
      videoIndex: {
        courseID: req.course._id.toString(),
        videoId: videoId.toString(),
      },
      takeTo: {
        schema: "VideoInfo",
        id: videoId,
        key: "videoURL",
      },
    }));

    // 批量創建排程
    await vimeoSchedule.insertMany(schedules);

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `創建 ${videoIds.length} 個影片更新排程`
    );

    return res.json({
      success: true,
      msg: "已成功創建更新排程，系統將在背景處理更新操作",
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "vimeoMigrate.js",
      "updateUrls",
      `創建影片更新排程失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "創建更新排程時發生錯誤",
    });
  }
});

module.exports = router;
