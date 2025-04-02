const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const QA = require("../../../models").QA;
const compressImageBuffer =
  require("../../../methods/imageCompresser").compressImageBuffer;
const accessChecker = require("../../routesMiddleware/accessChecker");
const multer = require("multer");
const { QAmessage } = require("../../../models");

// 設定 multer：指定欄位名稱 "image"，最多上傳 10 張圖片
const upload = multer().fields([{ name: "image", maxCount: 10 }]);

/* -------------------------------
   共用工具函數
---------------------------------*/
// 取得圖片儲存的基底路徑
function getBaseImagePath() {
  return path.join(__dirname, "../../../resource/questionIMG");
}

// 取得指定 question 對應的資料夾路徑
function getQuestionFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

// 確保指定資料夾存在，不存在則建立
function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

/**
 * 根據傳入的 rmIMG 陣列，刪除 oldImages 中對應的圖片檔案，
 * 並回傳更新後的圖片相對路徑陣列
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

/* -------------------------------
   GET: 取得問題資訊 (並修正圖片 URL)
   將 DB 中存的相對路徑改成完整 URL，
   例如：process.env.SERVER_IP/resource/questionIMG/【相對路徑】
---------------------------------*/
router.get("/getQuestion", async (req, res) => {
  try {
    // 取得分頁與排序參數
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortByParam = req.query.sortBy || "lastUpdate"; // 若為 "createDate"，以 date 排序
    const sortOrder = req.query.sortOrder || "asc";
    // 可選 "resourceCategories" 或 "hints"
    const sortType = req.query.sortType || "resourceCategories";

    // 決定排序欄位與排序方向
    const sortField = sortByParam === "createDate" ? "date" : "lastUpdate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // 建立 aggregation pipeline
    const pipeline = [
      {
        // 新增一個欄位 sortField，依據所選欄位
        $addFields: {
          sortField: `$${sortField}`,
        },
      },
      {
        // 針對 sortType 欄位 (陣列) 做展開，產生單筆文件，每筆文件會包含一個 tag 值
        $unwind: `$${sortType}`,
      },
      {
        // 依據 sortField 排序
        $sort: { sortField: sortDirection },
      },
      {
        // 依照展開後的 tag 分組，每組收集符合條件的 QA 文件
        $group: {
          _id: `$${sortType}`, // 分組依據的標籤
          docs: { $push: "$$ROOT" },
          representative: { $first: "$sortField" }, // 以第一筆作為代表排序值
        },
      },
      {
        // 每組僅取最多 3 筆 QA 文件
        $addFields: {
          docs: { $slice: ["$docs", 3] },
        },
      },
      {
        // 依據代表排序值，再次排序各組
        $sort: { representative: sortDirection },
      },
      {
        // 分頁處理：跳過前面 (page - 1)*pageSize 筆組，再取 pageSize 筆
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];

    // 執行聚合查詢
    const groups = await QA.aggregate(pipeline);

    // 處理每個 QA 文件的 image 欄位，補上 SERVER_IP 前綴
    const transformedGroups = groups.map((group) => {
      const tag = group._id;
      const docs = group.docs.map((doc) => {
        if (Array.isArray(doc.image)) {
          doc.image = doc.image.map((relPath) => {
            return `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`;
          });
        }
        return doc;
      });
      return { tag, docs };
    });

    return res.json({
      success: true,
      data: transformedGroups,
      page, // 回傳目前頁碼
      pageSize, // 回傳每頁分組數量
      sortBy: sortByParam,
      sortOrder,
      sortType,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "取得資源時發生錯誤" });
  }
});

/* -------------------------------
   POST: 建立新問題
---------------------------------*/
router.post("/postQuestion", upload, async (req, res) => {
  try {
    let {
      course_ids,
      isPublic = false,
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

    // 僅要求必須提供敘述
    if (!description) {
      return res.status(400).json({ success: false, msg: "必須提供敘述" });
    }

    if (isPublic === true && req.user.role === "student") {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有將此問題公開的權利" });
    }
    if (req.user.role !== "admin") {
      const allCoursesIncluded = course_ids.every((courseId) =>
        req.user.courses.includes(courseId)
      );
      if (!allCoursesIncluded) {
        return res
          .status(401)
          .json({ success: false, msg: "你不是此課程的成員" });
      }
    }
    if (isPublic === false && !course_ids.length) {
      return res
        .status(400)
        .json({ success: false, msg: "必須提供上傳課程ID" });
    }

    // 產生新的 QA 文件 ID，並以此作為圖片儲存的資料夾名稱
    const qaId = new mongoose.Types.ObjectId();
    const baseImagePath = getBaseImagePath();
    const questionFolder = getQuestionFolder(qaId);
    ensureFolderExists(questionFolder);

    // 如果上傳了圖片，則處理圖片上傳；若無則 imagesRelativePaths 為空陣列
    let imagesRelativePaths = [];
    if (req.files && req.files.image && Array.isArray(req.files.image)) {
      imagesRelativePaths = await saveUploadedImages(
        req.files.image,
        questionFolder,
        qaId,
        0
      );
    }

    const newQA = new QA({
      _id: qaId,
      image: imagesRelativePaths,
      description,
      resourceCategories,
      hints,
      isPublic,
      courses: course_ids,
      poster: req.user._id,
    });

    const savedQA = await newQA.save();
    return res.json({
      success: true,
      msg: "新問題創建成功",
      data: { QA_id: savedQA._id },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

/* -------------------------------
   PATCH: 修改問題
   - 處理舊圖片刪除 (根據 rmIMG)
   - 處理新圖片上傳，並確保命名不重複
---------------------------------*/
/*
前端說明:
若要更新欄位，請在請求中包含該欄位的鍵值。若想要將欄位內容更新為空值，請傳入 null，
例如:
{
  "description": "新的描述",
  "hints": null // 表示將 hints 更新為空值
}
若某個欄位不傳，則保留原有資料不變。
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
        rmIMG, // array(index)
        replied,
      } = req.body;
      console.log(req.body);

      // 必須提供有效的 question_id
      if (!mongoose.Types.ObjectId.isValid(question_id)) {
        return res.status(400).json({ success: false, msg: "無效的問題ID" });
      }

      // 若前端有傳入 course_ids 且非 null，則需為非空陣列
      if (course_ids !== null) {
        if (!Array.isArray(course_ids) || course_ids.length === 0) {
          return res
            .status(400)
            .json({ success: false, msg: "請提供有效的課程陣列" });
        }
      }

      const oldQA = await QA.findById(question_id);
      if (!oldQA) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到對應的問題" });
      }

      const baseImagePath = getBaseImagePath();
      const questionFolder = getQuestionFolder(question_id);
      ensureFolderExists(questionFolder);

      if (Array.isArray(rmIMG)) {
        oldQA.image = removeOldImages(oldQA.image, rmIMG, baseImagePath);
      }

      const nextIndex =
        (oldQA.image || [])
          .map((relPath) => Number(path.basename(relPath).split(/[_\.]/)[1]))
          .reduce((max, cur) => (cur > max ? cur : max), -1) + 1;

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

      // 僅更新前端有傳入的欄位（即使值為 null）
      if (course_ids !== undefined) {
        oldQA.courses = course_ids;
      }
      if (isPublic !== undefined) {
        oldQA.isPublic = isPublic;
      }
      if (description !== undefined) {
        oldQA.description = description;
      }
      if (resourceCategories !== undefined) {
        oldQA.resourceCategories = resourceCategories;
      }
      if (hints !== undefined) {
        oldQA.hints = hints;
      }
      if (replied !== undefined) {
        oldQA.replied = replied;
      }

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

router.delete(
  "/deleteQuestion",
  accessChecker.updateAndDeleteQuestion,
  async (req, res) => {
    try {
      const { question_id } = req.query;
      if (!mongoose.Types.ObjectId.isValid(question_id)) {
        return res.status(400).json({ success: false, msg: "無效的問題ID" });
      }

      // 由於問題圖片資料夾的刪除已放在 QA 模型的 pre hook 中，
      // 因此這裡不再需要手動刪除資料夾

      // 找出所有關聯此問題的留言（pointTo 為該問題ID）
      const comments = await QAmessage.find({ pointTo: question_id });
      for (const comment of comments) {
        // 呼叫 findByIdAndDelete 刪除留言，留言內的圖片與影片排程會由 QAmessage 的 hook 自動處理
        await QAmessage.findByIdAndDelete(comment._id);
      }

      // 刪除問題資料（刪除前會先觸發 QA 模型的 pre hook 刪除圖片資料夾）
      await QA.findByIdAndDelete(question_id);

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
