/**
 * @file QAMethod.js
 * @description 問答方法相關路由處理，包含留言的增刪改查和圖片處理
 * @author StudyWeb Team
 * @date 2024-03-30
 */

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
const { logError, log } = require("../../../utils/logger");

/**
 * 設定 multer 中間件，使用 memoryStorage 來接收檔案
 * 檔案資料會存放在 req.files[*].buffer 中
 */
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 處理上傳的留言圖片：壓縮後存檔至指定資料夾
 * 儲存路徑格式： process.env.SERVER_IP/resource/questionIMG/comment/{commentId}/image_{index}.jpg
 * @param {Array} files - multer 處理後的檔案陣列 (含 buffer 與原始檔名)
 * @param {string|ObjectId} questionId - 問題的 _id，作為資料夾名稱
 * @param {string|ObjectId} commentId - 留言的 _id，作為資料夾名稱
 * @param {number} [startingIndex=1] - 檔案命名起始編號，預設為 1
 * @returns {Promise<Array>} - 回傳圖片相對路徑陣列，例如：["resource/questionIMG/comment/xxx/image_1.jpg"]
 */
async function saveUploadedCommentImages(
  files,
  questionId,
  commentId,
  startingIndex = 1
) {
  // 定義目標資料夾路徑（不包含 SERVER_IP）
  const folderPath = path.join(
    "resource",
    "questionIMG",
    String(questionId),
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
        String(questionId),
        "comment",
        String(commentId),
        fileName
      );
    })
  );
  return savedPaths;
}

/**
 * 獲取問題詳情
 * @route GET /
 * @returns {Object} 問題詳情
 */
router.get("/", async (req, res) => {
  try {
    return res.json({ success: true, data: req.question, msg: "" });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "getQuestion",
      `獲取問題詳情失敗`,
      error
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

/**
 * 獲取問題的留言列表
 * @route GET /getComment
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortOrder=desc] - 排序方向，asc 為升序（舊到新），desc 為降序（新到舊）
 * @returns {Object} 留言列表，包含留言者信息、圖片URL和分頁信息
 */
router.get("/getComment", async (req, res) => {
  try {
    // 解析查詢參數
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // 計算跳過的文檔數量
    const skip = (page - 1) * pageSize;

    // 依照 QAmessage 的 pointTo 查詢相關留言，並 populate poster 欄位
    const messages = await QAmessage.find({
      pointTo: req.question._id,
    })
      .populate("poster", "role userinfo.username userinfo.pictureUrl")
      .sort({ isBest: -1, date: sortOrder }) // 先按 isBest 降序，再按日期排序
      .skip(skip)
      .limit(pageSize);

    // 獲取總留言數
    const totalMessages = await QAmessage.countDocuments({
      pointTo: req.question._id,
    });

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

    // 計算總頁數
    const totalPages = Math.ceil(totalMessages / pageSize);

    return res.json({
      success: true,
      data: transformedMessages,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalMessages,
        totalPages,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "getComment",
      `獲取留言列表失敗`,
      error
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

/**
 * 發布新留言
 * @route POST /postNewComment
 * @param {string} content - 留言內容
 * @param {number} [fileSize] - 影片檔案大小（字節）
 * @param {boolean} [isPrivate=false] - 是否為私密留言
 * @param {boolean} [isBest=false] - 是否為最佳答案
 * @param {Object[]} [image] - 上傳的圖片檔案
 * @returns {Object} 留言結果，包含上傳連結（如果有影片）
 */
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
    if (isBest === true && req.user.role === "student") {
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
        req.question._id,
        newComment._id,
        1
      );
      newComment.image = savedImagePaths;
      await newComment.save();
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "postNewComment",
      `新增留言 ${newComment._id}`
    );

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
          {
            questionID: req.question._id.toString(),
            commentID: newComment._id.toString(),
          }
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
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "postNewComment",
      `新增留言失敗`,
      error
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

/**
 * 更新影片上傳狀態
 * @route PATCH /uploadVideoStatus
 * @param {boolean} isUploadSuccess - 影片是否上傳成功
 * @param {string} commentID - 留言ID
 * @returns {Object} 更新結果
 */
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
        videoIndex: {
          questionID: req.question._id.toString(),
          commentID: commentID.toString(),
        },
      });
      newSchedule.save();
      await QAmessage.findByIdAndDelete(commentID);

      log(
        {
          userIp: req.ip,
          userId: req.user._id,
          userName: req.user.userinfo.realname,
        },
        "QAMethod.js",
        "uploadVideoStatus",
        `刪除上傳失敗的影片 ${commentID}`
      );

      return res.json({ success: true, msg: "已將此資源刪除" });
    }
    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({
      questionID: req.question._id.toString(),
      commentID: commentID.toString(),
    });
    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
    } else {
      const newSchedule = new vimeoSchedule({
        method: "get",
        videoIndex: {
          questionID: req.question._id.toString(),
          commentID: commentID.toString(),
        },
        takeTo: {
          schema: "QAmessage",
          id: commentID,
          key: "videoURL",
        },
      });
      newSchedule.save();
    }
    await foundItem.save();

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "uploadVideoStatus",
      `更新影片上傳狀態 ${commentID}`
    );

    return res.json({ success: true, msg: "更新成功" });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "uploadVideoStatus",
      `更新影片上傳狀態失敗`,
      error
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

/**
 * 刪除留言
 * @route DELETE /deleteComment
 * @param {string} commentID - 要刪除的留言ID
 * @returns {Object} 刪除結果
 */
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
      return res.status(403).json({
        success: false,
        msg: "你不屬於本課程",
      });
    }
    // 若為 student，僅能刪除自己的留言
    if (
      req.user.role === "student" &&
      String(foundComment.poster) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        msg: "你沒有刪除此留言的權限",
      });
    }

    // 呼叫 findByIdAndDelete，刪除前會先執行 pre hook 的資源清理邏輯
    await QAmessage.findByIdAndDelete(commentID);

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "deleteComment",
      `刪除留言 ${commentID}`
    );

    return res.json({
      success: true,
      msg: "成功刪除留言",
    });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "deleteComment",
      `刪除留言失敗`,
      error
    );
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

/**
 * 修改留言
 * @route PATCH serverIp + `/course/question/QAMethod/${qa_id}/patchComment`
 * @param {string} commentID - 要修改的留言ID
 * @param {string} [content] - 新的留言內容
 * @param {boolean} [isPrivate] - 是否設為私密留言
 * @param {boolean} [isBest] - 是否設為最佳答案
 * @param {Array} [rmIMG] - 要刪除的圖片索引陣列
 * @param {Object[]} [image] - 新增的圖片檔案
 * @returns {Object} 修改結果
 */
router.patch("/patchComment", upload.array("image"), async (req, res) => {
  try {
    const { commentID, content, isPrivate, isBest, rmIMG } = req.body;
    if (!commentID) {
      return res.status(400).json({ success: false, msg: "缺少 commentID" });
    }

    // 取得留言資料
    const foundComment = await QAmessage.findById(commentID);
    if (!foundComment) {
      return res.status(400).json({ success: false, msg: "找不到留言資料" });
    }

    // 權限檢查：若使用者不屬於本課程或不是 admin，不允許修改
    if (
      !req.question.courses.some((item) => req.user.courses.includes(item)) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        msg: "你不屬於本課程",
      });
    }
    // 若為 student，僅能修改自己的留言
    if (
      req.user.role === "student" &&
      String(foundComment.poster) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        msg: "你沒有修改此留言的權限",
      });
    }

    // 更新留言內容
    if (content !== undefined) {
      foundComment.content = content;
    }

    // 更新私密狀態
    if (isPrivate !== undefined) {
      foundComment.isPrivate = isPrivate;
    }

    // 更新最佳答案狀態
    if (isBest !== undefined) {
      // 只有教師和管理員可以設定最佳答案
      if (req.user.role !== "student") {
        foundComment.isBest = isBest;
      } else {
        return res.status(403).json({
          success: false,
          msg: "學生無法設定最佳答案",
        });
      }
    }

    // 處理圖片刪除
    if (rmIMG && Array.isArray(rmIMG) && rmIMG.length > 0) {
      // 將字串索引轉換為數字
      const indicesToRemove = rmIMG.map((index) => parseInt(index));
      // 過濾掉要刪除的圖片
      foundComment.image = foundComment.image.filter(
        (_, index) => !indicesToRemove.includes(index)
      );
    }

    // 處理新增圖片
    if (req.files && req.files.length > 0) {
      const savedImagePaths = await saveUploadedCommentImages(
        req.files,
        req.question._id,
        foundComment._id,
        foundComment.image.length + 1
      );
      // 將新圖片路徑添加到現有圖片陣列
      foundComment.image = [...foundComment.image, ...savedImagePaths];
    }

    await foundComment.save();

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "patchComment",
      `更新留言 ${commentID}`
    );

    return res.json({
      success: true,
      msg: "成功修改留言",
    });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "QAMethod.js",
      "patchComment",
      `更新留言失敗`,
      error
    );
    return res.status(500).json({
      success: false,
      msg: "伺服器發生問題",
    });
  }
});

module.exports = router;
