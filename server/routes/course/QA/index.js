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

// 取得公開問題，並修正 image URL
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

// 取得某課程問題，並修正 image URL
/**
 * GET /getCourseQAs/:course_id
 *
 * 查詢指定課程的 QA 資料，支援分群、分頁與排序。
 *
 * 查詢參數：
 * - page (預設: 1)：目前要顯示的分群頁碼。
 * - pageSize (預設: 10)：每頁回傳的「不同」標籤數量。
 * - sortBy (預設: "lastUpdate")：排序依據。
 *      若傳入 "createDate"，則根據 QA 文件內的 date 欄位排序；
 *      其他則預設依據 lastUpdate 欄位排序。
 * - sortOrder (預設: "asc")：排序方向，"asc" 為升冪，"desc" 為降冪。
 * - sortType (預設: "resourceCategories")：分群依據，可選 "resourceCategories" 或 "hints"。
 *
 * 回傳資料：
 * 回傳一個陣列，每個元素代表一個不同的 sortType 標籤，結構如下：
 * {
 *    tag: <標籤內容>,
 *    qas: [ ... ] // 該標籤下最多三筆 QA 資料，依 sortBy 與 sortOrder 排序
 * }
 * 並同時回傳目前的 page、pageSize、sortBy、sortOrder 與 sortType 等參數資訊。
 */

router.get("/getCourseQAs/:course_id", async (req, res) => {
  try {
    // 取得查詢參數，並設定預設值
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy || "lastUpdate"; // 若為 "createDate"，則依據 date 欄位排序
    const sortOrder = req.query.sortOrder || "asc"; // "asc" 或 "desc"
    const sortType = req.query.sortType || "resourceCategories"; // 可選 "resourceCategories" 或 "hints"
    console.log(sortType)
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
 * GET /getCourseQAsByTag/:course_id
 *
 * 前端使用說明：
 * --------------------------------------------
 * 此接口根據指定課程 (course_id) 回傳符合特定標籤的 QA 資料，
 * 請求中必須提供單一的標籤過濾參數（僅接受一個），
 * 可選擇以下其中之一：
 * - resourceCategory：回傳所有 QA 資料中，resourceCategories 欄位包含指定標籤的資料。
 * - hint：回傳所有 QA 資料中，hints 欄位包含指定標籤的資料。
 *
 * 注意事項：
 * - 請勿同時提供 resourceCategory 與 hint 參數，也不可提供多個標籤值，
 *   否則接口將回傳 400 錯誤訊息。
 * - 分頁參數：
 *   • page（預設：1）：當前頁碼。
 *   • pageSize（預設：15）：每頁回傳 QA 筆數。
 *
 * 範例：
 * 1. GET /getCourseQAsByTag/course123?resourceCategory=A&page=1&pageSize=15
 *    → 回傳所有 resourceCategories 包含 "A" 的 QA 資料（依 lastUpdate 降冪排序）。
 *
 * 2. GET /getCourseQAsByTag/course123?hint=甲&page=1&pageSize=15
 *    → 回傳所有 hints 包含 "甲" 的 QA 資料（依 lastUpdate 降冪排序）。
 * --------------------------------------------
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
