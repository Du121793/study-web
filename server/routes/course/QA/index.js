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
const { logError, log } = require("../../../utils/logger");

router.use("/modifyQA", modifyQARoute);
router.use("/QAMethod/:question_id", checkQuestionAccess, QAMethodRoute);

/**
 * 獲取公開問題列表
 * @route GET /getPublicQAs
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortBy="lastUpdate"] - 排序欄位，"createDate"或"lastUpdate"
 * @param {string} [sortOrder="desc"] - 排序方向，"asc"為升序，"desc"為降序
 * @param {string} [sortType="resourceCategories"] - 分群依據，"resourceCategories"、"hints"或"none"
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
    const sortType = req.query.sortType || "resourceCategories";

    // 設置排序欄位
    const sortField = sortBy === "createDate" ? "date" : "lastUpdate";

    // 如果 sortType 為 none，直接返回分頁後的問題列表
    if (sortType === "none") {
      const questions = await QA.find({ isPublic: true })
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      // 處理圖片URL
      const transformedQuestions = questions.map((doc) => {
        if (Array.isArray(doc.image)) {
          doc.image = doc.image.map((relPath) => {
            return `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`;
          });
        }
        return doc;
      });

      return res.json({
        success: true,
        data: transformedQuestions,
        page,
        pageSize,
        sortBy,
        sortOrder,
        sortType,
      });
    }

    // 構建聚合管道
    const pipeline = [
      // 添加公開過濾條件
      {
        $match: {
          isPublic: true,
        },
      },
      // 添加排序欄位
      {
        $addFields: {
          sortField: `$${sortField}`,
        },
      },
      // 展開標籤陣列
      {
        $unwind: `$${sortType}`,
      },
      // 按排序欄位排序
      {
        $sort: { sortField: sortOrder },
      },
      // 按標籤分組
      {
        $group: {
          _id: `$${sortType}`,
          docs: { $push: "$$ROOT" },
          representative: { $first: "$sortField" },
        },
      },
      // 限制每組文檔數量
      {
        $addFields: {
          docs: { $slice: ["$docs", 3] },
        },
      },
      // 按代表值排序
      {
        $sort: { representative: sortOrder },
      },
      // 分頁處理
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];

    // 執行聚合查詢
    const groups = await QA.aggregate(pipeline);

    // 處理圖片URL
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
      page,
      pageSize,
      sortBy,
      sortOrder,
      sortType,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "index.js",
      "getPublicQAs",
      `獲取公開問題列表失敗`,
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
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
 * @param {string} [sortType="resourceCategories"] - 分群依據，"resourceCategories"、"hints"或"none"
 * @returns {Object} 按標籤分組的課程問題列表及分頁資訊
 */
router.get("/getCourseQAs/:course_id", async (req, res) => {
  try {
    // 解析查詢參數，設置默認值
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortByParam = req.query.sortBy || "lastUpdate";
    const sortOrder = req.query.sortOrder || "asc";
    const sortType = req.query.sortType || "resourceCategories";

    // 設置排序欄位和方向
    const sortField = sortByParam === "createDate" ? "date" : "lastUpdate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // 如果 sortType 為 none，直接返回分頁後的問題列表
    if (sortType === "none") {
      const totalQuestions = await QA.countDocuments({
        courses: req.params.course_id,
      });
      const totalPage = Math.ceil(totalQuestions / pageSize);

      const questions = await QA.find({ courses: req.params.course_id })
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      // 處理圖片URL
      const transformedQuestions = questions.map((doc) => {
        if (Array.isArray(doc.image)) {
          doc.image = doc.image.map((relPath) => {
            return `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`;
          });
        }
        return doc;
      });
      return res.json({
        success: true,
        data: transformedQuestions,
        page,
        pageSize,
        totalPage,
        sortBy: sortByParam,
        sortOrder,
        sortType,
      });
    }

    // 構建聚合管道
    const pipeline = [
      // 添加課程過濾條件
      {
        $match: {
          courses: req.params.course_id,
        },
      },
      // 添加排序欄位
      {
        $addFields: {
          sortField: `$${sortField}`,
        },
      },
      // 展開標籤陣列
      {
        $unwind: `$${sortType}`,
      },
      // 按排序欄位排序
      {
        $sort: { sortField: sortDirection },
      },
      // 按標籤分組
      {
        $group: {
          _id: `$${sortType}`,
          docs: { $push: "$$ROOT" },
          representative: { $first: "$sortField" },
        },
      },
      // 限制每組文檔數量
      {
        $addFields: {
          docs: { $slice: ["$docs", 3] },
        },
      },
      // 按代表值排序
      {
        $sort: { representative: sortDirection },
      },
      // 分頁處理
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];

    // 執行聚合查詢
    const groups = await QA.aggregate(pipeline);
    // 1. 聚合 pipeline：match → unwind → group → count
    const countResult = await QA.aggregate([
      { $match: { courses: req.params.course_id } },
      { $unwind: `$${sortType}` },
      { $group: { _id: `$${sortType}` } },
      { $count: "totalGroups" }
    ]);
    // 如果沒有任何組，countResult 會是空陣列
    const totalGroups = (countResult[0] && countResult[0].totalGroups) || 0;

    // 2. 計算總頁數
    const totalPage = Math.ceil(totalGroups / pageSize);

    // 處理圖片URL
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
      page,
      pageSize,
      totalPage,
      sortBy: sortByParam,
      sortOrder,
      sortType,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "index.js",
      "getCourseQAs",
      `獲取課程問題列表失敗`,
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
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
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "index.js",
      "getQAsByTag",
      `獲取標籤問題列表失敗`,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

/**
 
獲取課程的所有標籤和主題
@route GET /getCourseTags/:course_id
@param {string} course_id - 課程ID
@returns {Object} 包含課程所有標籤和主題的物件*/
router.get("/getCourseTags/:course_id", async (req, res) => {
  try {
    const courseId = req.params.course_id;

    // 使用聚合管道獲取所有不重複的標籤和主題
    const result = await QA.aggregate([
      // 只選擇屬於指定課程的問題
      { $match: { courses: courseId } },
      // 展開 resourceCategories 和 hints 陣列
      { $unwind: "$resourceCategories" },
      { $unwind: "$hints" },
      // 分組並收集不重複的標籤和主題
      {
        $group: {
          _id: null,
          resourceCategories: { $addToSet: "$resourceCategories" },
          hints: { $addToSet: "$hints" },
        },
      },
      // 移除 _id 欄位
      { $project: { _id: 0 } },
    ]);

    // 如果沒有找到任何標籤或主題，返回空陣列
    const tags =
      result.length > 0 ? result[0] : { resourceCategories: [], hints: [] };

    return res.json({
      success: true,
      msg: "",
      data: tags,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "index.js",
      "GET /getCourseTags/:course_id",
      req.query,
      e
    );
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});

module.exports = router;
