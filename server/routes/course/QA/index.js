/**
 * @file index.js
 * @description 課程問答相關路由處理，包含問答查詢、修改和管理功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const Course = require("../../../models").course;
const QA = require("../../../models").QA;
const modifyQARoute = require("./modifyQA");
const QAMethodRoute = require("./QAMethod");
const checkTeacherAccess =
  require("../../routesMiddleware/accessChecker").teacher;
const checkQuestionAccess =
  require("../../routesMiddleware/accessChecker").question;

router.use("/modifyQA", modifyQARoute);
router.use("/QAMethod/:question_id", checkQuestionAccess, QAMethodRoute);

/**
 * 獲取公開問題列表
 * @route GET /getPublicQAs
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortBy="lastUpdate"] - 排序欄位
 * @param {string} [sortOrder="desc"] - 排序方向，"asc"為升序，"desc"為降序
 * @returns {Object} 公開問題列表及分頁資訊
 */
router.get("/getPublicQAs", checkTeacherAccess, async (req, res) => {
  try {
    // 取得分頁與排序參數，預設值如下：
    // page 預設為 1, pageSize 預設為 10
    // sortBy 預設為 "lastUpdate"
    // sortOrder 預設為 "desc"（降冪排序，表示最新的在前）
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy || "lastUpdate";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // 取得符合條件的 QA 筆數（總數）
    const total = await QA.countDocuments({ isPublic: true });

    // 查詢所有公開的 QA，並依據 sortBy 與 sortOrder 進行排序，
    // 並依照分頁參數進行跳過與限制
    const foundQAs = await QA.find({ isPublic: true })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // 轉換 QA 資料，並將 image 路徑補上伺服器前綴
    const updatedQAs = foundQAs.map((qa) => {
      const qaObj = qa.toObject();
      if (Array.isArray(qaObj.image)) {
        qaObj.image = qaObj.image.map(
          (relPath) =>
            `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`
        );
      }
      return qaObj;
    });

    // 回傳結果包含分頁資訊與排序參數
    return res.json({
      success: true,
      msg: "",
      page,
      pageSize,
      total,
      data: updatedQAs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

/**
 * 獲取課程問題列表
 * @route GET /getCourseQAs/:course_id
 * @param {string} course_id - 課程ID
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortBy="lastUpdate"] - 排序欄位，"createDate"或"lastUpdate"
 * @param {string} [sortOrder="asc"] - 排序方向，"asc"為升序，"desc"為降序
 * @param {string} [sortType="resourceCategories"] - 分群依據，"resourceCategories"或"hints"
 * @returns {Object} 按標籤分組的課程問題列表及分頁資訊
 */
router.get("/getCourseQAs/:course_id", async (req, res) => {
  try {
    // 取得查詢參數，並設定預設值
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy || "lastUpdate"; // 若為 "createDate"，則依據 date 欄位排序
    const sortOrder = req.query.sortOrder || "asc"; // "asc" 或 "desc"
    const sortType = req.query.sortType || "resourceCategories"; // 可選 "resourceCategories" 或 "hints"
    // 決定排序欄位與方向
    const sortField = sortBy === "createDate" ? "date" : "lastUpdate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // 先查詢出該課程所有 QA，並依據指定欄位排序
    const qas = await QA.find(
      { courses: req.params.course_id },
      "_id image description resourceCategories hints replied date lastUpdate"
    ).sort({ [sortField]: sortDirection });

    // 將 QA 文件轉換成 JS 物件，並處理 image 欄位加上伺服器前綴
    const transformedQAs = qas.map((qa) => {
      const qaObj = qa.toObject();
      if (Array.isArray(qaObj.image)) {
        qaObj.image = qaObj.image.map(
          (relPath) =>
            `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`
        );
      }
      return qaObj;
    });

    // 依據 sortType（resourceCategories 或 hints）進行分群
    // 注意：此欄位皆為陣列，所以一筆 QA 可能屬於多個群組
    const groups = {}; // key: 標籤, value: 陣列（包含屬於該標籤的 QA）
    transformedQAs.forEach((qa) => {
      const tags = qa[sortType] || [];
      tags.forEach((tag) => {
        if (!groups[tag]) {
          groups[tag] = [];
        }
        groups[tag].push(qa);
      });
    });

    // 對每個群組內的 QA 再次排序，並限制最多 3 筆
    const groupEntries = Object.entries(groups).map(([tag, qaList]) => {
      // 依 sortField 與 sortDirection 排序 QA
      qaList.sort((a, b) => {
        const timeA = new Date(a[sortField]).getTime();
        const timeB = new Date(b[sortField]).getTime();
        return sortDirection * (timeA - timeB);
      });
      // 取得該群組內排序後的前三筆資料
      const limitedQAs = qaList.slice(0, 3);
      // 以群組代表值排序：取該群組中第一筆 QA 的 sortField 值作為代表
      const groupSortValue =
        limitedQAs.length > 0
          ? new Date(limitedQAs[0][sortField]).getTime()
          : 0;
      return { tag, qas: limitedQAs, groupSortValue };
    });

    // 將群組依代表值進行排序
    groupEntries.sort(
      (a, b) => sortDirection * (a.groupSortValue - b.groupSortValue)
    );

    // 分頁：僅回傳 pageSize 個群組
    const paginatedGroups = groupEntries.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    // 回傳結果，包含查詢參數資訊
    return res.status(200).json({
      success: true,
      msg: "",
      page,
      pageSize,
      sortBy,
      sortOrder,
      sortType,
      data: paginatedGroups,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

/**
 * 根據標籤獲取課程問題
 * @route GET /getCourseQAsByTag/:course_id
 * @param {string} course_id - 課程ID
 * @param {string} [resourceCategory] - 資源類別標籤
 * @param {string} [hint] - 提示標籤
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=15] - 每頁筆數
 * @returns {Object} 符合標籤的課程問題列表及分頁資訊
 */
router.get("/getCourseQAsByTag/:course_id", async (req, res) => {
  try {
    // 取得分頁參數，預設 page = 1, pageSize = 15
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 15;

    // 取得過濾參數（僅接受單一標籤值）
    const resourceCategory = req.query.resourceCategory;
    const hint = req.query.hint;

    // 檢查：必須提供且僅提供一個過濾參數
    if (
      (!resourceCategory && !hint) ||
      (resourceCategory && hint) ||
      (Array.isArray(resourceCategory) && resourceCategory.length > 1) ||
      (Array.isArray(hint) && hint.length > 1)
    ) {
      return res.status(400).json({
        success: false,
        msg: "請僅提供單一標籤過濾參數，且必須提供 resourceCategory 或 hint",
      });
    }

    const courseId = req.params.course_id;

    // 建立查詢條件：必須屬於指定課程
    const filter = { courses: courseId };
    if (resourceCategory) {
      // 過濾 QA，其 resourceCategories 欄位包含指定標籤
      filter.resourceCategories = resourceCategory;
    }
    if (hint) {
      // 過濾 QA，其 hints 欄位包含指定標籤
      filter.hints = hint;
    }

    // 查詢符合條件的 QA，依 lastUpdate 降冪排序（最新的在前）
    const allQAs = await QA.find(filter).sort({ lastUpdate: -1 });

    // 分頁處理
    const total = allQAs.length;
    const paginatedQAs = allQAs.slice((page - 1) * pageSize, page * pageSize);

    return res.json({
      success: true,
      msg: "",
      page,
      pageSize,
      total,
      data: paginatedQAs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

module.exports = router;
