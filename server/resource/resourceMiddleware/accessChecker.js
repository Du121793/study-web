/**
 * @file accessChecker.js
 * @description 資源存取權限檢查中間件，用於驗證使用者對特定資源的存取權限
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const QA = require("../../models").QA;
const { logError } = require("../../utils/logger");

/**
 * 問題資源存取權限檢查
 * @description 檢查使用者是否有權限存取特定問題的資源
 * @param {Object} req - Express 請求物件
 * @param {Object} req.params - 請求參數
 * @param {string} req.params.questionId - 問題 ID
 * @param {Object} req.user - 使用者資訊
 * @param {string} req.user.role - 使用者角色
 * @param {Array} req.user.courses - 使用者已選課程列表
 * @param {Object} res - Express 回應物件
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void}
 */
const question = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    // 檢查是否提供問題 ID
    if (!questionId) {
      return res
        .status(403)
        .json({ success: false, msg: "不允許直接存取 questionIMG" });
    }

    // 檢查是否為管理員
    if (req.user.role === "admin") {
      return next();
    }

    // 查找問題資料
    const questionDoc = await QA.findById(questionId);
    if (!questionDoc) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到對應的問題資料" });
    }

    // 檢查是否為公開問題且使用者為教師
    if (questionDoc.isPublic && req.user.role === "teacher") {
      return next();
    }

    // 檢查使用者是否有權限存取該問題的課程
    const userCoursesSet = new Set(req.user.courses.map(String));
    const questionCourses = questionDoc.courses.map(String);

    const hasPermission = questionCourses.some((courseId) =>
      userCoursesSet.has(courseId)
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ success: false, msg: "您無權限存取此問題的檔案" });
    }

    // 通過所有檢查，進入下一個中間件
    return next();
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user?._id,
        userName: req.user?.userinfo?.realname,
      },
      "accessChecker.js",
      "question middleware",
      {},
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
};

module.exports = { question };
