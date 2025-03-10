const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Course = require("../../../models").course;
const User = require("../../../models").user;
const QA = require("../../../models").QA;
const QAmessage = require("../../../models").QAmessage;
const imageCompresser = require("../../../methods/imageCompresser");
const accessChecker = require("../../routesMiddleware/accessChecker");
const VimeoMethods = require("../../../methods").vimeoMethods;

/* -------------------------------
   共用工具函數
---------------------------------*/
// 取得圖片儲存的基底路徑
function getBaseImagePath() {
  return path.join(__dirname, "../../../resource/questionIMG");
}

// 組合留言圖片資料夾路徑： <baseImagePath>/<questionId>/comment/<commentId>
function getCommentFolder(questionId, commentId) {
  return path.join(
    getBaseImagePath(),
    String(questionId),
    "comment",
    String(commentId)
  );
}

// 確保指定資料夾存在
function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

/**
 * 處理留言圖片：對上傳的圖片依序用 compressImageBuffer 壓縮、命名並存檔，
 * 回傳每張圖片相對於基底路徑的儲存路徑。
 * @param {Array} files - 上傳檔案陣列（來自 multer）
 * @param {string} commentFolder - 留言圖片存放的完整資料夾路徑
 * @param {string|ObjectId} questionId - 該留言所屬 question 的 ID
 * @param {string|ObjectId} commentId - 留言的 ID
 * @returns {Promise<Array<string>>} - 圖片相對路徑陣列
 */
async function saveCommentImages(files, commentFolder, questionId, commentId) {
  const imagePaths = await Promise.all(
    files.map(async (file, index) => {
      const compressedBuffer = await imageCompresser.compressImageBuffer(
        file.buffer
      );
      const fileName = `comment_image_${index}.jpg`;
      const filePath = path.join(commentFolder, fileName);
      fs.writeFileSync(filePath, compressedBuffer);
      // 相對路徑格式： "questionId/comment/commentId/comment_image_index.jpg"
      return `${questionId}/comment/${commentId}/${fileName}`;
    })
  );
  return imagePaths;
}

/* -------------------------------
   GET Routes
---------------------------------*/
router.get("/", async (req, res) => {
  try {
    console.log(req.question);
    return res.json({ success: true, data: req.question, msg: "" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.get("/getComment", async (req, res) => {
  try {
    // 取得分頁與排序參數
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy || "default"; // 預設為 default 模式
    const sortOrder = req.query.sortOrder || "asc"; // 預設排序方向為 asc

    // 根據 sortBy 與 sortOrder 設定排序條件
    let sortQuery = {};
    if (sortBy === "date") {
      // 僅依據上傳時間排序：asc 為舊的在前，desc 為新的在前
      sortQuery = { createdAt: sortOrder === "asc" ? 1 : -1 };
    } else {
      // default 模式：先將 isBest 為 true 的留言放最前面，再依上傳時間排序
      // 當 sortOrder 為 asc 時：上傳時間越近 (新留言) 排在前面
      // 當 sortOrder 為 desc 時：上傳時間越久 (舊留言) 排在前面，但 isBest 留言永遠在最前
      sortQuery = {
        isBest: -1,
        createdAt: sortOrder === "asc" ? -1 : 1,
      };
    }

    // 查詢留言，並加入 populate、排序與分頁
    const messages = await QAmessage.find({
      pointTo: req.question._id,
    })
      .populate("poster", "role userinfo.username userinfo.pictureUrl")
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // 轉換每筆留言資料
    const transformedMessages = messages.map((msg) => {
      const data = msg.toObject();

      // 處理 image 陣列，加上伺服器 IP 前綴
      if (Array.isArray(data.image)) {
        data.image = data.image.map((imgPath) => {
          console.log(
            "address = ",
            `${process.env.SERVER_IP}/resource/questionIMG/${imgPath}`
          );
          return `${process.env.SERVER_IP}/resource/questionIMG/${imgPath}`;
        });
      }

      // 處理 poster 資訊
      let poster = data.poster
        ? {
            role: data.poster.role,
            username: data.poster.userinfo ? data.poster.userinfo.username : "",
            pictureUrl: data.poster.userinfo
              ? data.poster.userinfo.pictureUrl
              : "",
          }
        : null;
      // 若是匿名留言，覆蓋 poster 資訊
      if (data.isPrivate) {
        poster = { role: "匿名角色", username: "匿名", pictureUrl: "" };
      }

      return {
        ...data,
        poster,
      };
    });

    return res.json({
      success: true,
      data: transformedMessages,
      page, // 回傳目前頁碼
      pageSize, // 回傳每頁數量
      sortBy,
      sortOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "取得資源時發生錯誤" });
  }
});

/* -------------------------------
   POST: 建立新留言
   圖片處理：留言圖片存放至 <baseImagePath>/<req.question._id>/comment/<commentId>/
---------------------------------*/
const multer = require("multer");

// ★ 修改：使用 fields，而非 any() ★
const upload = multer().fields([{ name: "image", maxCount: 10 }]);

router.post("/postNewComment", upload, async (req, res) => {
  try {
    let { content, fileSize, isPrivate = false, isBest = false } = req.body;

    if (fileSize === "undefined") {
      fileSize = false;
    }
    console.log("content", content);
    console.log("fileSize", fileSize);
    console.log("isPrivate", isPrivate);
    console.log("isBest", isBest);

    // 若沒有 content、也沒有圖片、也沒有 fileSize，則資料不完整
    if (
      !(
        content ||
        (req.files &&
          req.files.image &&
          Array.isArray(req.files.image) &&
          req.files.image.length > 0) ||
        fileSize
      )
    ) {
      return res.status(400).json({ success: false, msg: "資料提供不完整" });
    }

    // 若 isBest 為 true 且角色是 student，則不允許
    if (isBest && req.user.role === "student") {
      return res.status(400).json({ success: false, msg: "資料提供不完整" });
    }

    // 產生 comment 的 _id 並建立留言圖片資料夾
    const commentId = new mongoose.Types.ObjectId();
    const commentFolder = getCommentFolder(req.question._id, commentId);
    ensureFolderExists(commentFolder);

    // 預設圖片路徑陣列為空
    let commentImagePaths = [];

    // 如果有上傳圖片，才進行壓縮與存檔
    if (
      req.files &&
      req.files.image &&
      Array.isArray(req.files.image) &&
      req.files.image.length > 0
    ) {
      commentImagePaths = await saveCommentImages(
        req.files.image,
        commentFolder,
        req.question._id,
        commentId
      );
    }

    // 若有影片 (fileSize)，代表檔案還沒正式上傳成功
    const isUploadSuccess = fileSize ? false : true;

    // 建立新的留言文件
    const newComment = new QAmessage({
      _id: commentId,
      pointTo: req.question._id,
      content,
      image: commentImagePaths,
      isUploadSuccess,
      isPrivate,
      isBest,
      poster: req.user._id,
    });

    await newComment.save();

    // 如果有 fileSize，代表要去 Vimeo 申請上傳連結
    let uploadLink = {};
    if (fileSize) {
      try {
        const ViemoRes = await VimeoMethods.upload(
          {
            title: `留言影片:${newComment._id}`,
            fileSize,
            type: "QA",
          },
          { questionID: req.question._id, commentID: newComment._id }
        );
        if (!ViemoRes.success) {
          await QAmessage.findByIdAndDelete(newComment._id);
          return res.json({ success: false, msg: "請求連結發生錯誤" });
        }
        uploadLink = ViemoRes.uploadLink;
      } catch {
        await QAmessage.findByIdAndDelete(newComment._id);
        return res.json({ success: false, msg: "請求連結發生錯誤" });
      }
    }

    // 當上傳成功時，更新 QA 的 lastUpdate 為現在時間
    await QA.findByIdAndUpdate(req.question._id, { lastUpdate: Date.now() });

    return res.json({
      success: true,
      msg: "留言成功發布，若有影片上傳請使用上傳連結",
      data: { uploadLink, commentID: newComment._id },
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, msg: "發生錯誤，無法成功留言" });
  }
});

/* -------------------------------
   PATCH: 更新影片上傳狀態
---------------------------------*/
router.patch("/uploadVideoStatus", async (req, res) => {
  try {
    const { isUploadSuccess, commentID } = req.body;
    console.log("isUploadSuccess", isUploadSuccess);
    console.log("commentID", commentID);
    if (typeof isUploadSuccess !== "boolean" || !commentID) {
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });
    }

    const foundItem = await QAmessage.findById(commentID);
    if (!foundItem) {
      return res
        .status(400)
        .json({ success: false, msg: "伺服器無法找到此資源" });
    }

    if (foundItem.isUploadSuccess == true) {
      return res
        .status(400)
        .json({ success: false, msg: "你無法修改已經上傳成功的留言" });
    }

    if (!isUploadSuccess) {
      await QAmessage.findByIdAndDelete(commentID);
      return res.json({ success: true, msg: "已將此資源刪除" });
    }

    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({ commentID });
    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
    } else {
      foundItem.isUploadSuccess = false;
    }

    await foundItem.save();
    return res.json({ success: true, msg: "已收到您的回傳結果" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

/* -------------------------------
   DELETE: 刪除留言
---------------------------------*/
router.delete("/deleteComment", async (req, res) => {
  try {
    const { commentID } = req.body;
    if (!commentID) {
      return res.status(400).json({ success: false, msg: "請提供 commentID" });
    }

    const foundComment = await QAmessage.findById(commentID);
    if (!foundComment) {
      return res.status(404).json({ success: false, msg: "找不到該留言" });
    }

    // 權限檢查：
    // 1. 檢查 req.question.courses 是否包含使用者的課程或使用者是 admin
    if (
      !req.question.courses.some((item) => req.user.courses.includes(item)) &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({ success: false, msg: "你不屬於本課程" });
    }
    // 2. 如果使用者是 student，則只能刪除自己張貼的留言
    if (
      req.user.role === "student" &&
      String(foundComment.poster) !== String(req.user._id)
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有刪除此留言的權限" });
    }

    // 刪除 Vimeo 上對應的影片（若有）
    await VimeoMethods.delete({ commentID });

    // 刪除留言圖片資料夾
    const commentFolder = getCommentFolder(foundComment.pointTo, commentID);
    if (fs.existsSync(commentFolder)) {
      fs.rmSync(commentFolder, { recursive: true, force: true });
    }

    await foundComment.remove();
    return res.json({ success: true, msg: "成功刪除留言" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

module.exports = router;
