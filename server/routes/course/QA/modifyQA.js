/**
 * @file modifyQA.js
 * @description 問答修改相關路由處理，包含問題的增刪改查和圖片處理
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const QA = require("../../../models").QA;
const Folder = require("../../../models").folder;
const compressImageBuffer =
  require("../../../methods/imageCompresser").compressImageBuffer;
const accessChecker = require("../../routesMiddleware/accessChecker");
const multer = require("multer");
const { QAmessage } = require("../../../models");
const publicFolderRouter = require("./publicFolder");

// 設定 multer：指定欄位名稱 "image"，最多上傳 10 張圖片
const upload = multer().fields([{ name: "image", maxCount: 10 }]);

// 引入 publicFolder 路由
router.use("/folder", publicFolderRouter);

/* -------------------------------
   共用工具函數
---------------------------------*/
/**
 * 取得圖片儲存的基底路徑
 * @returns {string} 圖片儲存的基底路徑
 */
function getBaseImagePath() {
  return path.join(__dirname, "../../../resource/questionIMG");
}

/**
 * 取得指定問題對應的資料夾路徑
 * @param {string|ObjectId} questionId - 問題ID
 * @returns {string} 問題對應的資料夾路徑
 */
function getQuestionFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

/**
 * 確保指定資料夾存在，不存在則建立
 * @param {string} folderPath - 資料夾路徑
 */
function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

/**
 * 根據傳入的 rmIMG 陣列，刪除 oldImages 中對應的圖片檔案，
 * 並回傳更新後的圖片相對路徑陣列
 * @param {Array} oldImages - 舊圖片相對路徑陣列
 * @param {Array} rmIMG - 要刪除的圖片索引陣列
 * @param {string} baseImagePath - 圖片儲存的基底路徑
 * @returns {Array} 更新後的圖片相對路徑陣列
 */
function removeOldImages(oldImages, rmIMG, baseImagePath) {
  if (!Array.isArray(oldImages)) return [];
  const rmSet = new Set(rmIMG.map((x) => Number(x)));
  return oldImages.filter((relPath) => {
    const fileName = path.basename(relPath); // 例如 "image_0.jpg"
    const parts = fileName.split(/[_\.]/);
    const index = Number(parts[1]);
    if (rmSet.has(index)) {
      const absPath = path.join(baseImagePath, relPath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      return false;
    }
    return true;
  });
}

/**
 * 處理新上傳圖片：依序壓縮圖片並存檔，產生相對路徑陣列
 * @param {Array} files - 上傳圖片檔案陣列 (由 multer 處理後的檔案)
 * @param {string} questionFolder - 該 QA 對應的資料夾路徑
 * @param {string|ObjectId} questionId - QA 的 ID，用於組合相對路徑
 * @param {number} startingIndex - 新圖片命名的起始編號
 * @returns {Array} - 相對路徑陣列
 */
async function saveUploadedImages(
  files,
  questionFolder,
  questionId,
  startingIndex
) {
  const savedPaths = await Promise.all(
    files.map(async (file, i) => {
      const compressedBuffer = await compressImageBuffer(file.buffer);
      const fileName = `image_${startingIndex + i}.jpg`;
      const filePath = path.join(questionFolder, fileName);
      fs.writeFileSync(filePath, compressedBuffer);
      // 存相對路徑，例如 "questionId/image_0.jpg"
      return `${questionId}/${fileName}`;
    })
  );
  return savedPaths;
}

/**
 * 創建新問題
 * @route POST /postQuestion
 * @param {string[]} course_ids - 課程ID陣列
 * @param {boolean} [isPublic=false] - 是否公開
 * @param {string} description - 問題描述
 * @param {string[]} [resourceCategories=["無特定主題"]] - 資源類別標籤
 * @param {string[]} [hints=["無特定知識點"]] - 提示標籤
 * @param {Object[]} [image] - 上傳的圖片檔案
 * @returns {Object} 新創建的問題
 */
router.post("/postQuestion", upload, async (req, res) => {
  try {
    // 解析請求參數
    let {
      course_ids,
      isPublic = false,
      folders,
      description,
      resourceCategories = ["無特定主題"],
      hints = ["無特定知識點"],
    } = req.body;

    // 處理陣列初始化，避免空陣列
    if (Array.isArray(resourceCategories) && resourceCategories.length === 0) {
      resourceCategories = ["無特定主題"];
    }
    if (Array.isArray(hints) && hints.length === 0) {
      hints = ["無特定知識點"];
    }
    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供有效的課程ID陣列" });
    }
    if (!description) {
      return res.status(400).json({ success: false, msg: "必須提供敘述" });
    }

    // 驗證權限
    if (isPublic === true && req.user.role === "student") {
      return res
        .status(403)
        .json({ success: false, msg: "你沒有將此問題公開的權利" });
    }
    if (req.user.role !== "admin") {
      const allCoursesIncluded = course_ids.every((courseId) =>
        req.user.courses.includes(courseId)
      );
      if (!allCoursesIncluded) {
        return res
          .status(403)
          .json({ success: false, msg: "你不是此課程的成員" });
      }
    }
    if (isPublic === false && !course_ids.length) {
      return res
        .status(400)
        .json({ success: false, msg: "必須提供上傳課程ID" });
    }

    if (isPublic == false || !folders) {
      folders = [];
    }

    if (isPublic && folders.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "設為公開，必須提供資料夾陣列" });
    }

    // 處理圖片上傳
    const qaId = new mongoose.Types.ObjectId();
    const baseImagePath = getBaseImagePath();
    const questionFolder = getQuestionFolder(qaId);
    ensureFolderExists(questionFolder);

    let imagesRelativePaths = [];
    if (req.files && req.files.image && Array.isArray(req.files.image)) {
      imagesRelativePaths = await saveUploadedImages(
        req.files.image,
        questionFolder,
        qaId,
        0
      );
    }

    // 創建並保存新問題
    const newQA = new QA({
      _id: qaId,
      image: imagesRelativePaths,
      description,
      resourceCategories,
      hints,
      courses: course_ids,
      isPublic,
      poster: req.user._id,
    });

    const savedQA = await newQA.save();
    return res.status(201).json({ success: true, data: savedQA });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "建立問題時發生錯誤" });
  }
});

/**
 * 修改問題
 * @route PATCH /patchQuestion
 * @param {string} question_id - 問題ID
 * @param {string[]} [course_ids] - 課程ID陣列，不傳則保留原有資料
 * @param {boolean} [isPublic] - 是否公開，不傳則保留原有資料
 * @param {string} [description] - 問題描述，不傳則保留原有資料
 * @param {string[]} [resourceCategories] - 資源類別標籤，不傳則保留原有資料
 * @param {string[]} [hints] - 提示標籤，不傳則保留原有資料
 * @param {number[]} [rmIMG] - 要刪除的圖片索引陣列
 * @param {boolean} [replied] - 是否已回覆，不傳則保留原有資料
 * @param {Object[]} [image] - 上傳的新圖片檔案
 * @returns {Object} 更新後的問題ID
 */
router.patch(
  "/patchQuestion",
  upload,
  accessChecker.updateAndDeleteQuestion,
  async (req, res) => {
    try {
      const {
        question_id,
        course_ids,
        isPublic,
        description,
        resourceCategories,
        hints,
        rmIMG,
        replied,
        folders,
      } = req.body;

      // 驗證問題ID
      if (!mongoose.Types.ObjectId.isValid(question_id)) {
        return res.status(400).json({ success: false, msg: "無效的問題ID" });
      }

      // 驗證課程ID陣列
      if (course_ids !== null) {
        if (!Array.isArray(course_ids) || course_ids.length === 0) {
          return res
            .status(400)
            .json({ success: false, msg: "請提供有效的課程陣列" });
        }
      }

      // 查找並驗證問題存在
      const oldQA = await QA.findById(question_id);
      if (!oldQA) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到對應的問題" });
      }

      // 處理圖片
      const baseImagePath = getBaseImagePath();
      const questionFolder = getQuestionFolder(question_id);
      ensureFolderExists(questionFolder);

      // 刪除舊圖片
      if (Array.isArray(rmIMG)) {
        oldQA.image = removeOldImages(oldQA.image, rmIMG, baseImagePath);
      }

      // 計算新圖片索引
      const nextIndex =
        (oldQA.image || [])
          .map((relPath) => Number(path.basename(relPath).split(/[_\.]/)[1]))
          .reduce((max, cur) => (cur > max ? cur : max), -1) + 1;

      // 處理新圖片上傳
      if (
        req.files &&
        Array.isArray(req.files.image) &&
        req.files.image.length > 0
      ) {
        const newPaths = await saveUploadedImages(
          req.files.image,
          questionFolder,
          question_id,
          nextIndex
        );
        oldQA.image = (oldQA.image || []).concat(newPaths);
      }

      // 更新問題資料
      if (course_ids !== undefined) oldQA.courses = course_ids;
      if (isPublic !== undefined) oldQA.isPublic = isPublic;
      if (description !== undefined) oldQA.description = description;
      if (resourceCategories !== undefined)
        oldQA.resourceCategories = resourceCategories;
      if (hints !== undefined) oldQA.hints = hints;
      if (replied !== undefined) oldQA.replied = replied;
      if (
        folders !== undefined &&
        (isPublic === true ||
          (isPublic !== undefined && oldQA.isPublic === true))
      )
        oldQA.folders = folders;
      // 保存更新
      const savedQA = await oldQA.save();
      return res.json({
        success: true,
        msg: "問題修改成功",
        data: { QA_id: savedQA._id },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: "發生了不可預期的錯誤" });
    }
  }
);

/**
 * 刪除問題
 * @route DELETE /deleteQuestion
 * @param {string} question_id - 要刪除的問題ID
 * @returns {Object} 刪除結果
 */
router.delete(
  "/deleteQuestion",
  accessChecker.updateAndDeleteQuestion,
  async (req, res) => {
    try {
      // 驗證問題ID
      const { question_id } = req.query;
      if (!mongoose.Types.ObjectId.isValid(question_id)) {
        return res.status(400).json({ success: false, msg: "無效的問題ID" });
      }

      // 刪除相關留言
      const comments = await QAmessage.find({ pointTo: question_id });
      for (const comment of comments) {
        await QAmessage.findOneAndDelete({ _id: comment._id });
      }

      // 刪除問題（圖片資料夾會由 hook 自動處理）
      await QA.findOneAndDelete({ _id: question_id });

      return res.json({ success: true, msg: "問題刪除成功" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: "發生了不可預期的錯誤" });
    }
  }
);

module.exports = router;
