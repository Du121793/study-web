const router = require("express").Router();
const VideoAccess = require("../../models").courseVideoAccess;
const VideoInfo = require("../../models").courseVideoInfo;
const User = require("../../models").User;
// CourseMethod/videoAccess

/**
 * 目標：VideoAccess 資料結構
 * {
 *   _id: ...,
 *   courseID: ...,
 *   videoIDs: [...],
 *   studentIDs: [...],
 *   accessDate: Date 或 null (無限期)
 * }
 */

// ------------------------------
// GET /videoAccess
// - Admin：回傳所有 VideoAccess 記錄（不限定課程）
// - 非 Admin：僅回傳當前課程 (req.course._id) 的 VideoAccess
// - 同時將 studentIDs / videoIDs 轉成指定格式
// ------------------------------
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
        return res.status(404).json({ success: false, msg: "找不到對應的存取紀錄" });
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "取得 video access 紀錄失敗" });
  }
});

// ------------------------------
// POST /videoAccess/postNewAccess
// 建立新的 VideoAccess 紀錄
// Body 參數: { accessName, videoIDs, studentIDs, accessDate, unlimited }
// - 所有課程都強制指定為 req.course._id
// - 若 unlimited = true，accessDate = null
// - studentIDs 必須都在 req.course.members 中
// - videoIDs 必須查詢確認都屬於該 course
// ------------------------------
router.post("/postNewAccess", async (req, res) => {
  try {
    let { accessName, videoIDs, studentIDs, accessDate, unlimited } = req.body;

    // 1) 若 unlimited 為 true，設為 null
    if (unlimited) {
      accessDate = null;
    }

    // 2) 確認 studentIDs 皆在 req.course.members 中
    if (studentIDs && Array.isArray(studentIDs)) {
      const notMember = studentIDs.find(
        (sid) => !req.course.members.includes(sid)
      );
      if (notMember) {
        return res.status(400).json({
          success: false,
          msg: "有指定的 studentIDs 不在本課程成員列表中",
        });
      }
    }

    // 3) 確認 videoIDs 皆屬於該課程
    if (videoIDs && Array.isArray(videoIDs) && videoIDs.length > 0) {
      const foundVideos = await VideoInfo.find({
        _id: { $in: videoIDs },
        courseID: req.course._id,
      }).select("_id");
      // 若查到的數量 < 傳入的數量，代表有不屬於本課程的影片
      if (foundVideos.length < videoIDs.length) {
        return res
          .status(400)
          .json({ success: false, msg: "有指定的 videoIDs 不屬於本課程" });
      }
    }

    // 4) 建立新紀錄
    const newAccess = new VideoAccess({
      courseID: req.course._id,
      videoIDs,
      studentIDs,
      accessDate,
      accessName,
      creater: req.user._id,
    });

    const savedAccess = await newAccess.save();
    return res.status(201).json({ success: true, data: savedAccess });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, msg: "建立 video access 紀錄失敗" });
  }
});

// ------------------------------
// PATCH /videoAccess/patchAccess/:id
// 更新指定的 VideoAccess 紀錄
// Body 參數:{ accessName, videoIDs, studentIDs, accessDate, unlimited }
// - studentIDs 需在 req.course.members
// - videoIDs 需屬於該課程
// - 若 unlimited = true，accessDate = null
// Admin 可修改所有紀錄，否則只改自己課程的紀錄 (courseID = req.course._id)
// ------------------------------
router.patch("/patchAccess/:id", async (req, res) => {
  try {
    const recordId = req.params.id;
    let { accessName, videoIDs, studentIDs, accessDate, unlimited } = req.body;

    if (unlimited) {
      accessDate = null;
    }

    // 構建更新物件
    const updateObj = {
      creater: req.user._id,
      date: Date.now(),
    };
    if (accessName !== undefined) updateObj.accessName = accessName;
    if (videoIDs !== undefined) updateObj.videoIDs = videoIDs;
    if (studentIDs !== undefined) updateObj.studentIDs = studentIDs;
    if (accessDate !== undefined) updateObj.accessDate = accessDate;

    // 若 body 有 studentIDs，檢查是否都在本課程
    if (studentIDs && Array.isArray(studentIDs)) {
      const notMember = studentIDs.find(
        (sid) => !req.course.members.includes(sid)
      );
      if (notMember) {
        return res.status(400).json({
          success: false,
          msg: "有指定的 studentIDs 不在本課程成員列表中",
        });
      }
    }

    // 若 body 有 videoIDs，檢查是否都屬於本課程
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
    }

    // 建立查詢條件 (Admin 可改所有, 非 Admin 只能改本課程)
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
    return res.json({ success: true, data: updatedRecord });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, msg: "更新 video access 紀錄失敗" });
  }
});

// ------------------------------
// DELETE /videoAccess/deleteAccess/:id
// 刪除指定的 VideoAccess 紀錄
// Admin 可刪除所有紀錄，非 Admin 只能刪除 courseID = req.course._id
// ------------------------------
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
    return res.json({ success: true, msg: "video access 紀錄已刪除" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, msg: "刪除 video access 紀錄失敗" });
  }
});

module.exports = router;
