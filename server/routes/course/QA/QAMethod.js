const router = require("express").Router();
const Course = require("../../../models").course;
const User = require("../../../models").user;
const QA = require("../../../models").QA;
const QAmessage = require("../../../models").QAmessage;
const imageCompresser = require("../../../methods/imageCompresser");
const { vimeoSchedule } = require("../../../models");
const videoInfoModel = require("../../../models/course/videoInfo-model");
const accessChecker = require("../../routesMiddleware/accessChecker");
const VimeoMethods = require("../../../methods").vimeoMethods;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// 使用 memoryStorage 來接收檔案，檔案資料會存放在 req.files[*].buffer 中
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 處理上傳的留言圖片：壓縮後存檔至指定資料夾
 * 儲存路徑格式： process.env.SERVER_IP/resource/questionIMG/comment/{commentId}/image_{index}.jpg
 * @param {Array} files - multer 處理後的檔案陣列 (含 buffer 與原始檔名)
 * @param {string|ObjectId} commentId - 留言的 _id，作為資料夾名稱
 * @param {number} startingIndex - 檔案命名起始編號，預設為 1
 * @returns {Promise<Array>} - 回傳圖片相對路徑陣列，例如：["resource/questionIMG/comment/xxx/image_1.jpg"]
 */
async function saveUploadedCommentImages(files, commentId, startingIndex = 1) {
  // 定義目標資料夾路徑（不包含 SERVER_IP）
  const folderPath = path.join(
    "resource",
    "questionIMG",
    "comment",
    String(commentId)
  );
  // 若資料夾不存在則自動建立（包含多層資料夾）
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  // 處理每個檔案
  const savedPaths = await Promise.all(
    files.map(async (file, i) => {
      // 壓縮圖片，這裡使用 imageCompresser.compressImageBuffer（依實際邏輯實作）
      const compressedBuffer = await imageCompresser.compressImageBuffer(
        file.buffer
      );
      // 依序命名檔案：image_1.jpg, image_2.jpg, ...
      const fileName = `image_${startingIndex + i}.jpg`;
      const filePath = path.join(folderPath, fileName);
      // 將壓縮後的 buffer 寫入檔案
      fs.writeFileSync(filePath, compressedBuffer);
      // 回傳相對路徑，不包含 process.env.SERVER_IP 部分
      return path.join(
        "resource",
        "questionIMG",
        "comment",
        String(commentId),
        fileName
      );
    })
  );
  return savedPaths;
}

router.get("/", async (req, res) => {
  try {
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
    // 依照 QAmessage 的 pointTo 查詢相關留言，並 populate poster 欄位
    const messages = await QAmessage.find({
      pointTo: req.question._id,
    }).populate("poster", "role userinfo.username userinfo.pictureUrl");

    // 定義 helper 函式：依相對路徑組合完整圖片 URL
    function getFullImageUrl(relativePath) {
      // 移除 process.env.SERVER_IP 最後可能的斜線
      const serverIP = process.env.SERVER_IP.replace(/\/$/, "");
      return `${serverIP}/${relativePath}`;
    }

    // 將每筆留言轉換成物件，並根據 isPrivate 的狀況修改 poster 欄位內容
    const transformedMessages = messages.map((msg) => {
      // 先取得原 poster 資料（注意有可能 poster 為 null）
      let poster = msg.poster
        ? {
            role: msg.poster.role,
            username: msg.poster.userinfo ? msg.poster.userinfo.username : "",
            pictureUrl: msg.poster.userinfo
              ? msg.poster.userinfo.pictureUrl
              : "",
          }
        : null;

      // 當留言設定為私密時，將 poster 資料替換為預設值
      if (msg.isPrivate) {
        poster = {
          role: "匿名角色",
          username: "匿名",
          pictureUrl: "",
        };
      }

      // 若留言有圖片，則將每個相對路徑組合成完整 URL
      let imageUrls = [];
      if (msg.image && Array.isArray(msg.image) && msg.image.length > 0) {
        imageUrls = msg.image.map((relativePath) =>
          getFullImageUrl(relativePath)
        );
      }

      // 回傳轉換後的留言物件（將 mongoose 文件轉換成純 JS 物件）
      return {
        ...msg.toObject(),
        poster,
        image: imageUrls,
      };
    });

    return res.json({ success: true, data: transformedMessages });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "取得資源時發生錯誤" });
  }
});

router.post("/postNewComment", upload.array("image"), async (req, res) => {
  try {
    const { content, fileSize, isPrivate = false, isBest = false } = req.body;
    // 上傳的圖片會存放在 req.files 陣列中
    const uploadedFiles = req.files || [];

    // 檢查必要欄位，至少需提供文字內容、圖片或檔案大小
    if (!content && uploadedFiles.length === 0 && !fileSize) {
      return res.status(400).json({ success: false, msg: "資料提供不完整" });
    }

    // 權限檢查：若 isBest 為 true，且使用者角色為 student 則拒絕
    if (isBest && req.user.role === "student") {
      return res.status(400).json({ success: false, msg: "資料提供不完整" });
    }

    // 若有影片上傳（fileSize 存在）則標記上傳未完成
    const isUploadSuccess = fileSize ? false : true;

    // 先建立留言文件，暫不包含圖片資料
    const newComment = new QAmessage({
      pointTo: req.question._id,
      content,
      image: [],
      isUploadSuccess,
      isPrivate,
      isBest,
      poster: req.user._id,
    });
    await newComment.save();

    // 處理留言圖片：若有上傳圖片則呼叫獨立的圖片處理函式
    if (uploadedFiles.length > 0) {
      const savedImagePaths = await saveUploadedCommentImages(
        uploadedFiles,
        newComment._id,
        1
      );
      newComment.image = savedImagePaths;
      await newComment.save();
    }

    // 處理留言影片上傳（若有提供 fileSize）
    let uploadLink = {};
    if (fileSize) {
      try {
        const VimeoRes = await VimeoMethods.upload(
          {
            title: `留言影片:${newComment._id}`,
            fileSize,
            type: "QA",
          },
          { questionID: req.question._id, commentID: newComment._id }
        );
        if (!VimeoRes.success) {
          await QAmessage.findByIdAndDelete(newComment._id);
          return res.json({ success: false, msg: "請求連結發生錯誤" });
        }
        uploadLink = VimeoRes.uploadLink;
      } catch (err) {
        await QAmessage.findByIdAndDelete(newComment._id);
        return res.json({ success: false, msg: "請求連結發生錯誤" });
      }
    }

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

router.patch("/uploadVideoStatus", async (req, res) => {
  try {
    const { isUploadSuccess, commentID } = req.body;
    if (typeof isUploadSuccess !== "boolean" || !commentID)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

    foundItem = await QAmessage.findById(commentID);

    if (!foundItem)
      return res
        .status(400)
        .json({ success: false, msg: "伺服器無法找到此資源" });

    if (!isUploadSuccess) {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { commentID: commentID },
      });
      newSchedule.save();
      await QAmessage.findByIdAndDelete(commentID);
      return res.json({ success: true, msg: "已將此資源刪除" });
    }
    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({ commentID });
    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
    } else {
      const newSchedule = new vimeoSchedule({
        method: "get",
        videoIndex: { commentID: commentID },
        takeTo: {
          schema: "QAmessage",
          id: foundItem._id,
          key: "videoURL",
        },
      });
      newSchedule.save();
      return res.json({
        success: true,
        msg: "已收到您的回傳結果，15分鐘後若無看到影片表示上傳失敗",
      });
    }

    await foundItem.save();

    return res.json({
      success: true,
      msg: "已收到您的回傳結果，影片已就緒",
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

router.delete("/deleteComment", async (req, res) => {
  try {
    const { commentID } = req.query;
    if (!commentID) {
      return res.status(400).json({ success: false, msg: "缺少 commentID" });
    }

    // 取得留言資料
    const foundComment = await QAmessage.findById(commentID);
    if (!foundComment) {
      return res.status(400).json({ success: false, msg: "找不到留言資料" });
    }

    // 權限檢查：若使用者不屬於本課程或不是 admin，不允許刪除
    if (
      !req.question.courses.some((item) => req.user.courses.includes(item)) &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        msg: `你不屬於本課程`,
      });
    }
    // 若為 student，僅能刪除自己的留言
    if (
      req.user.role === "student" &&
      String(foundComment.poster) !== String(req.user._id)
    ) {
      return res.status(401).json({
        success: false,
        msg: `你沒有刪除此留言的權限`,
      });
    }

    // 刪除留言中的圖片
    if (foundComment.image && Array.isArray(foundComment.image)) {
      foundComment.image.forEach((imgPath) => {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
    }

    // 如果 videoURL 存在，建立 Vimeo 刪除排程
    if (foundComment.videoURL) {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { commentID: foundComment._id },
      });
      await newSchedule.save();
    }

    // 刪除留言資料
    await QAmessage.findByIdAndDelete(foundComment);

    return res.json({
      success: true,
      msg: "成功刪除留言",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

module.exports = router;
