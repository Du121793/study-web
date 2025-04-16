/**
 * @file courseMethod.js
 * @description 課程方法相關路由處理，包含影片上傳、管理、訪問權限等功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const VideoAccess = require("../../models").courseVideoAccess;
const VimeoMethods = require("../../methods").vimeoMethods;
const vimeoSchedule = require("../../models").vimeoSchedule;
const imageCompresser = require("../../methods/imageCompresser");
const accessChecker = require("../routesMiddleware/accessChecker");
const videoAccessRoute = require("./videoAccess");
const vimeoMigrateRoute = require("./vimeoMigrate");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { logError, log } = require("../../utils/logger");

router.use("/videoAccess", accessChecker.teacher, videoAccessRoute);
router.use("/vimeoMigrate", accessChecker.teacher, vimeoMigrateRoute);

// 改用 memoryStorage，接收到的檔案將保留在 req.file.buffer 中
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 處理上傳的縮略圖圖片
 * @param {Object} file - 透過 multer 處理後的單一檔案
 * @param {string|ObjectId} videoId - 影片的 _id
 * @returns {Promise<string>} 寫入檔案的路徑
 */
async function processThumbnailImage(file, videoId) {
  return new Promise((resolve, reject) => {
    const fileExt = path.extname(file.originalname);
    const newFilename = videoId + fileExt + ".jpg";
    // 最終檔案存放在 resource/videoIMG/ 下
    const newPath = path.join("resource/videoIMG/", newFilename);

    // 直接寫入 buffer 到指定路徑
    fs.writeFile(newPath, file.buffer, (err) => {
      if (err) {
        console.error("寫入圖片檔案錯誤:", err);
        return reject(err);
      }
      resolve(newPath);
    });
  });
}
/**
 * 獲取課程成員列表
 * @route GET /members
 * @param {string} [role] - 成員角色過濾
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortBy] - 排序欄位（"grade" 或 "date"）
 * @param {string} [sortOrder="asc"] - 排序方向（"asc" 或 "desc"）
 * @returns {Object} 成員ID列表及分頁資訊
 */
router.get("/members", async (req, res) => {
  try {
    // 解析查詢參數
    const { role } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy; // 可選 "grade" 或 "date"
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // 建立過濾條件
    const filter = { courses: req.course._id };
    if (role) {
      filter.role = role;
    }

    // 設定排序條件
    let sortCriteria = {};
    if (sortBy === "grade") {
      sortCriteria = { "userinfo.grade": sortOrder, date: sortOrder };
    } else if (sortBy === "date") {
      sortCriteria = { date: sortOrder };
    }

    const skip = (page - 1) * pageSize;

    // 查詢成員
    const members = await User.find(filter, { _id: 1 })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize);

    // 獲取總數
    const total = await User.countDocuments(filter);

    // 提取成員ID
    const memberIds = members.map((member) => member._id);

    return res.json({
      success: true,
      data: memberIds,
      page,
      pageSize,
      total,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "courseMethod.js",
      "getMembers",
      `獲取課程成員列表失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
    });
  }
});

/**
 * 獲取課程影片信息
 * @route GET /videoInfo
 * @param {string} type - 影片類型（必填）
 * @param {number} [page=1] - 頁碼
 * @param {string} [sortBy] - 排序欄位
 * @param {string} [sortOrder] - 排序方向
 * @param {boolean} [noImg] - 是否不返回縮略圖
 * @returns {Object} 影片信息列表
 */
router.get("/videoInfo", async (req, res) => {
  try {
    // 解析查詢參數
    let { type, page = 1, sortBy, sortOrder, noImg } = req.query;
    let pageSize = req.query.pageSize;

    // 驗證必要參數
    if (!type) {
      return res.status(400).json({ success: false, msg: "type is required" });
    }

    // 建立過濾條件
    const filter = {
      courseID: req.course._id,
      type: type,
      isUploadSuccess: true,
    };

    // 設定排序
    const allowedSortFields = ["length", "recordDate", "date"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sortOptions = { [sortField]: sortDirection };

    // 設定返回欄位
    let fields = "title description thumbnail length recordDate date isPrivate";
    // 若傳入 noImg，則不回傳 thumbnail
    if (noImg == true) {
      fields = "title description length recordDate date isPrivate";
    }

    // 建立查詢
    let query = VideoInfo.find(filter).select(fields).sort(sortOptions);

    // 處理分頁
    if (typeof pageSize !== "undefined") {
      const pageSizeNum = parseInt(pageSize);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * pageSizeNum;
      query = query.skip(skip).limit(pageSizeNum);
    }

    // 執行查詢並處理結果
    let foundVideoInfo = await query;
    foundVideoInfo = await Promise.all(
      foundVideoInfo.map(async (item) => {
        let plainItem = item.toObject();
        let hasAccess = true;
        let accessRecord = null;

        // 處理私有影片的訪問權限
        if (plainItem.isPrivate && req.user.role === 'student') {
          const records = await VideoAccess.aggregate([
            {
              $match: {
                courseID: req.course._id,
                videoIDs: { $in: [plainItem._id] },
                studentIDs: { $in: [req.user._id] },
              },
            },
            {
              $addFields: {
                effectiveAccessDate: {
                  $ifNull: ["$accessDate", new Date(8640000000000000)],
                },
              },
            },
            {
              $sort: { effectiveAccessDate: -1 },
            },
            {
              $limit: 1,
            },
          ]);

          accessRecord = records[0] || null;
          hasAccess = !!accessRecord;
        }

        // 添加訪問權限信息
        plainItem.access = {
          isAccess: hasAccess,
          accessDate: accessRecord ? accessRecord.accessDate : null,
        };

        // 處理縮略圖URL
        if (plainItem.thumbnail) {
          plainItem.thumbnail =
            `${process.env.SERVER_IP}/` + plainItem.thumbnail;
        }

        return plainItem;
      })
    );

    return res.json({ success: true, data: foundVideoInfo });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "courseMethod.js",
      "getVideoInfo",
      `獲取課程影片信息失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
    });
  }
});

/**
 * 獲取影片URI
 * @route GET /videoUri
 * @param {string} videoId - 影片ID
 * @returns {Object} 影片嵌入鏈接
 */
router.get("/videoUri", async (req, res) => {
  try {
    // 獲取影片ID
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ success: false, msg: "videoId 必須提供" });
    }

    // 查找影片信息
    const foundVideo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideo) {
      return res.status(404).json({ success: false, msg: "找不到該影片資料" });
    }

    // 檢查訪問權限
    if (foundVideo.isPrivate && req.user.role === "student") {
      const access = !!(await VideoAccess.findOne({
        courseID: req.course._id,
        videoIDs: { $in: [videoId] },
        studentIDs: { $in: [req.user._id] },
      }));

      if (!access) {
        return res
          .status(403)
          .json({ success: false, msg: "你沒有觀看此影片的權限" });
      }
    }

    // 返回影片信息
    return res.json({
      success: true,
      data: {
        embedLink: foundVideo.videoURL,
      },
    });
  } catch (err) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "courseMethod.js",
      "GET /videoUri",
      req.query,
      err
    );
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
      error: err,
    });
  }
});

/**
 * 上傳影片
 * @route POST /uploadVideo
 * @param {Object} thumbnail - 影片縮略圖文件
 * @param {string} title - 影片標題
 * @param {string} description - 影片描述
 * @param {string} type - 影片類型
 * @param {boolean} isPrivate - 是否為私有影片
 * @returns {Object} 上傳結果
 */
router.post(
  "/uploadVideo",
  [accessChecker.teacher, upload.single("thumbnail")],
  async (req, res) => {
    try {
      // 由 formData 取得文字欄位
      const {
        title,
        fileSize,
        description,
        type,
        length,
        recordDate,
        isPrivate,
      } = req.body;

      // 檢查必要欄位
      if (!title || !fileSize)
        return res.status(400).json({ success: false, msg: "上傳資料缺少" });

      // 由於 formData 傳送的布林值為字串，需轉換
      let isPrivateBool = false;
      if (isPrivate !== undefined) {
        if (isPrivate === "true") {
          isPrivateBool = true;
        } else if (isPrivate === "false") {
          isPrivateBool = false;
        } else {
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate必須是布林值" });
        }
      }

      const { subject, grade, courseClass } = req.course;

      // 建立新影片資料，不先加入 thumbnail 欄位
      const newVideoInfoParams = recordDate
        ? {
            title,
            courseID: req.course._id,
            type,
            description: description || "",
            length: length || 0,
            isPrivate: isPrivateBool,
            recordDate,
          }
        : {
            title,
            courseID: req.course._id,
            type,
            description: description || "",
            isPrivate: isPrivateBool,
            length: length || 0,
          };

      const newVideoInfo = new VideoInfo(newVideoInfoParams);
      const savedVideoInfo = await newVideoInfo.save();

      // 若有上傳 thumbnail，則呼叫獨立的函式進行檔案處理
      if (req.file) {
        const thumbnailPath = await processThumbnailImage(
          req.file,
          savedVideoInfo._id
        );
        savedVideoInfo.thumbnail = thumbnailPath;
        await savedVideoInfo.save();
      }

      // 準備影片上傳所需的 videoIndex 物件
      let videoIndex = {
        videoID: savedVideoInfo._id,
        courseID: req.course._id,
        subject,
        grade,
        courseClass,
      };

      // 呼叫 VimeoMethods.upload 進行影片上傳
      const uploadUri = await VimeoMethods.upload(req.body, videoIndex);
      if (!uploadUri.success)
        return res.status(500).json({
          success: false,
          msg: "目前請求繁忙請稍等一分鐘後再進行請求",
        });

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        `上傳影片 ${title}`
      );

      return res.json({ success: true, data: uploadUri });
    } catch (e) {
      logError(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        "courseMethod.js",
        "uploadVideo",
        `上傳影片失敗`,
        e
      );
      return res.status(500).json({
        success: false,
        msg: "很抱歉，伺服器目前無法處理您的要求",
      });
    }
  }
);

/**
 * 更新影片上傳狀態
 * @route PATCH /uploadVideoStatus
 * @param {boolean} isUploadSuccess - 上傳是否成功
 * @param {string} videoId - 影片ID
 * @returns {Object} 更新結果
 */
router.patch("/uploadVideoStatus", accessChecker.teacher, async (req, res) => {
  try {
    const { isUploadSuccess, videoId } = req.body;
    if (typeof isUploadSuccess !== "boolean" || !videoId)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

    let foundItem = await VideoInfo.findById(videoId);

    if (!foundItem)
      return res
        .status(400)
        .json({ success: false, msg: "伺服器無法找到此資源" });

    if (!isUploadSuccess) {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: {
          courseID: foundItem.courseID.toString(),
          videoId: videoId.toString(),
        },
      });
      newSchedule.save();
      await VideoInfo.findByIdAndDelete(videoId);

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        `刪除上傳失敗的影片 ${foundItem.title} (${videoId})`
      );

      return res.json({ success: true, msg: "已將此資源刪除" });
    }

    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({
      courseID: foundItem.courseID.toString(),
      videoId: videoId.toString(),
    });

    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
      await foundItem.save();

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        `更新影片上傳狀態 ${foundItem.title} (${videoId})`
      );

      return res.json({ success: true, msg: "已收到您的回傳結果，影片已就緒" });
    } else {
      const newSchedule = new vimeoSchedule({
        method: "get",
        videoIndex: {
          courseID: foundItem.courseID.toString(),
          videoId: videoId.toString(),
        },
        takeTo: {
          schema: "VideoInfo",
          id: foundItem._id,
          key: "videoURL",
        },
      });
      newSchedule.save();

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        `創建影片更新排程 ${foundItem.title} (${videoId})`
      );

      return res.json({
        success: true,
        msg: "已收到您的回傳結果，15分鐘後若無看到影片表示上傳失敗",
      });
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

/**
 * 更新影片信息
 * @route PATCH /patchVideo
 * @param {string} videoID - 影片ID
 * @param {Object} [thumbnail] - 新的影片縮略圖文件
 * @param {string} [title] - 新的影片標題
 * @param {string} [description] - 新的影片描述
 * @param {boolean} [isPrivate] - 是否為私有影片
 * @returns {Object} 更新後的影片信息
 */
router.patch(
  "/patchVideo",
  accessChecker.teacher,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const { videoID } = req.body;
      if (!videoID)
        return res.status(400).json({ success: false, msg: "缺少 videoID" });

      // 先取出資料庫中的原始影片資料，方便檢查舊的 thumbnail 是否存在
      const video = await VideoInfo.findById(videoID);
      if (!video)
        return res.status(404).json({ success: false, msg: "找不到該影片" });

      // 只允許更新 title、description、isPrivate 與 thumbnail
      const updateFields = {};

      // 處理 title：若有傳送，必須是字串且不能為 null
      if (req.body.hasOwnProperty("title")) {
        const title = req.body.title;
        if (title === null || title === "null")
          return res
            .status(400)
            .json({ success: false, msg: "title 不能傳入 null" });
        if (typeof title !== "string")
          return res
            .status(400)
            .json({ success: false, msg: "title 必須是字串" });
        updateFields.title = title;
      }

      // 處理 description：若傳入 null 則轉成空字串；型別必須為字串
      if (req.body.hasOwnProperty("description")) {
        let description = req.body.description;
        if (description === null || description === "null") {
          description = "";
        }
        if (typeof description !== "string")
          return res
            .status(400)
            .json({ success: false, msg: "description 必須是字串" });
        updateFields.description = description;
      }

      // 處理 isPrivate：若有傳送，不能為 null，且僅接受 "true" 或 "false" 字串
      if (req.body.hasOwnProperty("isPrivate")) {
        const isPrivate = req.body.isPrivate;
        if (isPrivate === null || isPrivate === "null")
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate 不能傳入 null" });
        let isPrivateBool;
        if (isPrivate === true) {
          isPrivateBool = true;
        } else if (isPrivate === false) {
          isPrivateBool = false;
        } else {
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate 必須是布林值" });
        }
        updateFields.isPrivate = isPrivateBool;
      }

      // 處理 thumbnail：若有上傳新的檔案，先刪除舊圖片，再重新命名上傳的檔案
      if (req.file) {
        // 若原本有舊的圖片，且檔案存在，先刪除掉
        if (video.thumbnail && fs.existsSync(video.thumbnail)) {
          fs.unlinkSync(video.thumbnail);
        }
        const fileExt = path.extname(req.file.originalname);
        // 新的檔案命名格式： resource/videoIMG/<courseID>/<videoID><副檔名>
        const newPath = path.join(
          `resource/videoIMG/${req.course._id}`,
          `${videoID}${fileExt}`
        );

        fs.renameSync(req.file.path, newPath);
        updateFields.thumbnail = newPath;
      }

      // 執行資料庫更新（忽略不允許更新的欄位）
      const updatedVideo = await VideoInfo.findByIdAndUpdate(
        videoID,
        updateFields,
        { new: true }
      );
      if (!updatedVideo)
        return res.status(404).json({ success: false, msg: "找不到該影片" });

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        `更新影片信息 ${updatedVideo.title} (${videoID})`
      );

      return res.json({ success: true, data: updatedVideo });
    } catch (e) {
      logError(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        "courseMethod.js",
        "updateVideo",
        `更新影片信息失敗`,
        e
      );
      return res.status(500).json({
        success: false,
        msg: "很抱歉，伺服器目前無法處理您的要求",
      });
    }
  }
);

/**
 * 刪除影片
 * @route DELETE /deleteVideo
 * @param {string} videoId - 要刪除的影片ID
 * @returns {Object} 刪除結果
 */
router.delete("/deleteVideo", accessChecker.teacher, async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ success: false, msg: "缺少 videoId" });
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, msg: "無效的 videoId" });
    }

    // 只做基本檢查 & 刪除，不用再手動刪縮圖或排程
    const foundVideoInfo = await VideoInfo.findOneAndDelete({ _id: videoId });
    if (!foundVideoInfo) {
      return res.status(404).json({ success: false, msg: "找不到影片資料" });
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `刪除影片 ${foundVideoInfo.title} (${videoId})`
    );

    return res.json({ success: true, msg: "已刪除影片並更新資料庫" });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "courseMethod.js",
      "deleteVideo",
      `刪除影片失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
    });
  }
});

module.exports = router;
