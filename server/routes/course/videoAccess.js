/**
 * @file videoAccess.js
 * @description 影片權限權限管理路由，處理影片權限記錄的增刪改查
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const VideoAccess = require("../../models").courseVideoAccess;
const VideoInfo = require("../../models").courseVideoInfo;
const User = require("../../models").user;
const { logError, log } = require("../../utils/logger");

/**
 * VideoAccess 資料結構
 * @typedef {Object} VideoAccess
 * @property {string} _id - 記錄ID
 * @property {string} courseID - 課程ID
 * @property {string[]} videoIDs - 影片ID列表
 * @property {string[]} studentIDs - 學生ID列表
 * @property {Date|null} accessDate - 權限截止日期，null表示無限期
 * @property {string} accessName - 權限記錄名稱
 * @property {string} creater - 創建者ID
 */

/**
 * 獲取影片權限記錄
 * @route GET /
 * @param {string} [access_id] - 可選的權限記錄ID，如果提供則只返回該記錄
 * @returns {Object} 影片權限記錄列表或單條記錄
 */
router.get("/", async (req, res) => {
  try {
    let queryCondition = { courseID: req.course._id };

    if (req.query.access_id) {
      // 當用戶傳入 access_id 時，僅回傳這一筆記錄
      queryCondition._id = req.query.access_id;
      const record = await VideoAccess.findOne(queryCondition)
        .populate({
          path: "studentIDs",
          select: "_id userinfo role",
        })
        .populate({
          path: "videoIDs",
          select: "_id title",
        })
        .populate({
          path: "creater",
          select: "_id userinfo",
        });
      if (!record) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到對應的存取紀錄" });
      }
      return res.json({ success: true, data: record });
    } else {
      // 未傳入 access_id，回傳該課程所有記錄
      const records = await VideoAccess.find(queryCondition)
        .populate({
          path: "studentIDs",
          select: "_id userinfo role",
        })
        .populate({
          path: "videoIDs",
          select: "_id title",
        })
        .populate({
          path: "creater",
          select: "_id userinfo",
        });
      return res.json({ success: true, data: records });
    }
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "videoAccess.js",
      "getAccess",
      `獲取影片權限記錄失敗`,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "取得 video access 紀錄失敗" });
  }
});

/**
 * 創建新的影片權限記錄
 * @route POST /postNewAccess
 * @param {string} accessName - 權限記錄名稱
 * @param {string[]} videoIDs - 影片ID列表
 * @param {string[]} studentIDs - 學生ID列表
 * @param {Date} [accessDate] - 權限截止日期
 * @param {boolean} [unlimited] - 是否無限期權限，true則忽略accessDate
 * @param {boolean} [setPrivate] - 是否將所有影片設為私密，true則設置
 * @returns {Object} 新創建的權限記錄
 */
router.post("/postNewAccess", async (req, res) => {
  try {
    let {
      accessName,
      videoIDs,
      studentIDs,
      accessDate,
      unlimited,
      setPrivate = true,
    } = req.body;

    // 1) 若 unlimited 為 true，則將 accessDate 設為 null
    if (unlimited) {
      accessDate = null;
    }

    // 2) 確認 studentIDs 都屬於該課程
    if (studentIDs && Array.isArray(studentIDs)) {
      // 從 User 模型中查詢，必須同時符合 _id 在 studentIDs 且 courses 陣列包含 req.course._id
      const validCount = await User.countDocuments({
        _id: { $in: studentIDs },
        courses: req.course._id,
      });
      if (validCount !== studentIDs.length) {
        return res.status(400).json({
          success: false,
          msg: "有指定的 studentIDs 不屬於本課程成員",
        });
      }
    }

    // 3) 確認 videoIDs 皆屬於該課程
    if (videoIDs && Array.isArray(videoIDs) && videoIDs.length > 0) {
      const foundVideos = await VideoInfo.find({
        _id: { $in: videoIDs },
        courseID: req.course._id,
      }).select("_id");
      // 若查到的數量小於傳入的數量，表示有不屬於本課程的影片
      if (foundVideos.length < videoIDs.length) {
        return res.status(400).json({
          success: false,
          msg: "有指定的 videoIDs 不屬於本課程",
        });
      }

      // 4) 如果 setPrivate 為 true，將所有影片設為私密
      if (setPrivate) {
        await VideoInfo.updateMany(
          { _id: { $in: videoIDs } },
          { $set: { isPrivate: true } }
        );
      }
    }

    // 5) 建立新的 VideoAccess 紀錄，所有課程強制指定為 req.course._id
    const newAccess = new VideoAccess({
      courseID: req.course._id,
      videoIDs,
      studentIDs,
      accessDate,
      accessName,
      creater: req.user._id,
    });

    const savedAccess = await newAccess.save();

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `創建影片權限記錄 ${accessName}`
    );

    return res.status(201).json({ success: true, data: savedAccess });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "videoAccess.js",
      "postNewAccess",
      `創建影片權限記錄失敗`,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "建立 video access 紀錄失敗" });
  }
});

/**
 * 更新影片權限記錄
 * @route PATCH /patchAccess/:id
 * @param {string} id - 權限記錄ID
 * @param {string} [accessName] - 權限記錄名稱
 * @param {string[]} [videoIDs] - 影片ID列表
 * @param {string[]} [studentIDs] - 學生ID列表
 * @param {Date} [accessDate] - 權限截止日期
 * @param {boolean} [unlimited] - 是否無限期權限，true則忽略accessDate
 * @param {boolean} [setPrivate] - 是否將所有影片設為私密，true則設置
 * @returns {Object} 更新後的權限記錄
 */
router.patch("/patchAccess/:id", async (req, res) => {
  try {
    const recordId = req.params.id;
    let {
      accessName,
      videoIDs,
      studentIDs,
      accessDate,
      unlimited,
      setPrivate = true,
    } = req.body;

    // 若 unlimited 為 true，將 accessDate 設為 null
    if (unlimited) {
      accessDate = null;
    }

    // 建立更新物件
    const updateObj = {
      creater: req.user._id,
      date: Date.now(),
    };
    if (accessName !== undefined) updateObj.accessName = accessName;
    if (videoIDs !== undefined) updateObj.videoIDs = videoIDs;
    if (studentIDs !== undefined) updateObj.studentIDs = studentIDs;
    if (accessDate !== undefined) updateObj.accessDate = accessDate;

    // 1) 檢查 studentIDs 是否皆屬於該課程
    // 從 User 模型中查詢，必須同時符合 _id 在 studentIDs 且 courses 陣列包含 req.course._id
    if (studentIDs && Array.isArray(studentIDs)) {
      const validCount = await User.countDocuments({
        _id: { $in: studentIDs },
        courses: req.course._id,
      });
      if (validCount !== studentIDs.length) {
        return res.status(400).json({
          success: false,
          msg: "有指定的 studentIDs 不屬於本課程成員",
        });
      }
    }

    // 2) 檢查 videoIDs 是否皆屬於該課程
    if (videoIDs && Array.isArray(videoIDs) && videoIDs.length > 0) {
      const foundVideos = await VideoInfo.find({
        _id: { $in: videoIDs },
        courseID: req.course._id,
      }).select("_id");
      if (foundVideos.length < videoIDs.length) {
        return res
          .status(400)
          .json({ success: false, msg: "有指定的 videoIDs 不屬於本課程" });
      }

      // 3) 如果提供了新的 videoIDs 且 setPrivate 為 true，將這些影片設為私密
      if (setPrivate) {
        await VideoInfo.updateMany(
          { _id: { $in: videoIDs } },
          { $set: { isPrivate: true } }
        );
      }
    }

    // 4) 建立查詢條件 (Admin 可修改所有紀錄，非 Admin 只可修改該課程的紀錄)
    const queryCondition = { _id: recordId };
    if (req.user.role !== "admin") {
      queryCondition.courseID = req.course._id;
    }

    const updatedRecord = await VideoAccess.findOneAndUpdate(
      queryCondition,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedRecord) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到該 video access 紀錄" });
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `更新影片權限記錄 ${recordId}`
    );

    return res.json({ success: true, data: updatedRecord });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "videoAccess.js",
      "patchAccess",
      `更新影片權限記錄失敗`,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "更新 video access 紀錄失敗" });
  }
});

/**
 * 刪除影片權限記錄
 * @route DELETE /deleteAccess/:id
 * @param {string} id - 權限記錄ID
 * @returns {Object} 刪除結果
 */
router.delete("/deleteAccess/:id", async (req, res) => {
  try {
    const recordId = req.params.id;

    const queryCondition = { _id: recordId };
    if (req.user.role !== "admin") {
      queryCondition.courseID = req.course._id;
    }

    const deletedRecord = await VideoAccess.findOneAndDelete(queryCondition);
    if (!deletedRecord) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到該 video access 紀錄" });
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `刪除影片權限記錄 ${recordId}`
    );

    return res.json({ success: true, msg: "video access 紀錄已刪除" });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "videoAccess.js",
      "deleteAccess",
      `刪除影片權限記錄失敗`,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "刪除 video access 紀錄失敗" });
  }
});

module.exports = router;
