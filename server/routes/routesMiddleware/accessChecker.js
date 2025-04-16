/**
 * @file accessChecker.js
 * @description 訪問權限檢查中間件，用於驗證用戶對不同資源的訪問權限
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const Course = require("../../models").course;
const QA = require("../../models").QA;
const mongoose = require("mongoose");
const { logError } = require("../../utils/logger");

/**
 * 檢查用戶是否有權限訪問指定課程
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void|Object} 如果權限檢查通過，調用 next()；否則返回錯誤響應
 */
const course = async (req, res, next) => {
  try {
    // 從請求參數中獲取課程ID
    let { course_id } = req.params;

    // 檢查課程ID是否存在且格式有效
    if (!course_id || !mongoose.Types.ObjectId.isValid(course_id)) {
      return res.status(400).json({ success: false, msg: "無效的路由" });
    }

    // 查詢課程是否存在
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "無法找到課程" });

    // 權限檢查：非管理員用戶必須是該課程的學生或教師
    if (req.user.role !== "admin") {
      if (
        !req.user.courses.find(
          (n) => n.toString() == foundCourse._id.toString()
        )
      ) {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "course",
          `嘗試訪問未授權課程 ${course_id}`
        );
        return res
          .status(403)
          .json({ success: false, msg: "你沒有訪問此課程的權限" });
      }
    }

    // 將找到的課程添加到請求對象中，供後續中間件使用
    req.course = foundCourse;
    next();
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user?._id,
        userName: req.user?.userinfo?.realname,
      },
      "accessChecker.js",
      "course middleware",
      {},
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法訪問此課程" });
  }
};

/**
 * 檢查用戶是否有權限訪問指定問題
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void|Object} 如果權限檢查通過，調用 next()；否則返回錯誤響應
 */
const question = async (req, res, next) => {
  try {
    // 從請求參數中獲取問題ID
    let { question_id } = req.params;

    // 檢查問題ID是否存在且格式有效
    if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
      return res.status(400).json({ success: false, msg: "無效的路由" });
    }

    // 查詢問題是否存在
    let foundQuestion = await QA.findOne({ _id: question_id })
  .populate("poster", "userinfo.username userinfo.pictureUrl userinfo.makePictureAnonymous")
  .exec();
    if (!foundQuestion)
      return res.status(400).json({ success: false, msg: "無法找到問題" });

    // 權限檢查：非管理員用戶的訪問權限檢查
    if (req.user.role !== "admin") {
      // 檢查用戶是否有權限訪問該問題（用戶的課程與問題的課程有交集）
      const commonElements = foundQuestion.courses.filter((item) =>
        req.user.courses.includes(item)
      );

      // 如果用戶沒有相關課程權限且問題不是公開的，則拒絕訪問
      if (commonElements.length === 0 && !foundQuestion.isPublic) {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "question",
          `嘗試訪問未授權問題 ${question_id}`
        );
        return res
          .status(403)
          .json({ success: false, msg: "你沒有訪問此問題的權限" });
      }

      // 如果是公開問題，學生無法訪問（僅教師可以訪問）
      if (foundQuestion.isPublic && req.user.role === "student") {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "question",
          `學生嘗試訪問公開問題 ${question_id}`
        );
        return res
          .status(403)
          .json({ success: false, msg: "你沒有訪問此問題的權限" });
      }
    }

    // 將找到的問題添加到請求對象中，供後續中間件使用
    req.question = foundQuestion;
    next();
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
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法訪問此問題" });
  }
};

/**
 * 檢查用戶是否有權限更新或刪除指定問題
 * 根據用戶角色（admin、teacher、student）進行不同的權限檢查
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void|Object} 如果權限檢查通過，調用 next()；否則返回錯誤響應
 */
const updateAndDeleteQuestion = async (req, res, next) => {
  try {
    // 獲取用戶角色和請求中的更新字段
    const role = req.user.role;
    const updateFields = Object.keys(req.body);

    // 從請求體或查詢參數中獲取問題ID
    const qaId = req.body.question_id
      ? req.body.question_id
      : req.query.question_id;

    // 查詢問題是否存在
    const resource = await QA.findById(qaId);
    req.question = resource;
    if (!resource) {
      return res.status(404).json({ success: false, msg: "資源不存在" });
    }

    // ───────────── admin 權限檢查 ─────────────
    if (role === "admin") {
      return next(); // 管理員擁有所有權限，不做任何限制
    }

    // ───────────── student 權限檢查 ─────────────
    if (role === "student") {
      // 檢查學生是否為問題的發布者
      if (resource.poster != req.user._id) {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "updateAndDeleteQuestion",
          `非發布者嘗試修改問題 ${qaId}`
        );
        return res.status(403).json({
          success: false,
          msg: `你沒有變更此問題的權限`,
        });
      }

      // 檢查學生是否嘗試修改不允許的欄位
      const forbiddenKeys = ["isPublic", "replied", "courses", "poster"];
      const invalidKeys = updateFields.filter((key) =>
        forbiddenKeys.includes(key)
      );
      if (invalidKeys.length > 0) {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "updateAndDeleteQuestion",
          `嘗試修改未授權欄位: ${invalidKeys.join(", ")}`
        );
        return res.status(403).json({
          success: false,
          msg: `學生不能修改這些欄位: ${invalidKeys.join(", ")}`,
        });
      }

      // 檢查問題是否已被回覆，已回覆的問題學生無法修改或刪除
      if (resource.replied === true) {
        logError(
          {
            userIp: req.ip,
            userId: req.user._id,
            userName: req.user.userinfo.realname,
          },
          "accessChecker.js",
          "updateAndDeleteQuestion",
          `嘗試修改已回覆問題 ${qaId}`
        );
        return res.status(403).json({
          success: false,
          msg: "資源已被回覆，無法修改或刪除",
        });
      }

      // 檢查學生是否只修改允許的欄位
      const allowedKeys = [
        "image",
        "description",
        "resourceCategories",
        "hints",
      ];
      const extraKeys = updateFields.filter(
        (key) => !allowedKeys.includes(key)
      );
      if (extraKeys.length > 0) {
        return res.status(403).json({
          success: false,
          msg: `學生只能修改 ${allowedKeys.join(
            ", "
          )}，不允許修改: ${extraKeys.join(", ")}`,
        });
      }
      return next();
    }

    // ───────────── teacher 權限檢查 ─────────────
    if (role === "teacher") {
      // 檢查教師是否屬於問題相關的課程
      if (
        !req.question.courses.some((item) => req.user.courses.includes(item))
      ) {
        return res.status(403).json({
          success: false,
          msg: `你不屬於本課程`,
        });
      }

      // 處理刪除請求
      if (req.method === "DELETE") {
        // 如果是公開問題，檢查所有相關課程是否都屬於此教師
        if (resource.isPublic) {
          const allCoursesIncluded = resource.courses.every((courseId) =>
            req.user.courses.includes(courseId)
          );
          if (!allCoursesIncluded) {
            return res.status(403).json({
              success: false,
              msg: "公開資源中包含非此教師的課程，無法執行刪除",
            });
          }
        }
        return next();
      }

      // 處理更新請求（PUT 或 PATCH）
      if (req.method === "PUT" || req.method === "PATCH") {
        // 檢查教師是否只修改允許的欄位
        const allowedKeys = [
          "isPublic",
          "replied",
          "courses",
          "hints",
          "resourceCategories",
        ];
        const invalidKeys = updateFields.filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          return res.status(403).json({
            success: false,
            msg: `教師只能修改 ${allowedKeys.join(", ")}`,
          });
        }

        // 如果更新包含 courses 欄位，進行額外檢查
        if (updateFields.includes("courses")) {
          // 確保 courses 是陣列
          if (!Array.isArray(req.body.courses)) {
            return res.status(400).json({
              success: false,
              msg: "courses 必須為陣列",
            });
          }

          // 獲取更新前後的課程列表
          const oldCourses = resource.courses;
          const newCourses = req.body.courses;

          // 計算被移除和新增的課程
          const removedCourses = oldCourses.filter(
            (c) => !newCourses.includes(c)
          );
          const addedCourses = newCourses.filter(
            (c) => !oldCourses.includes(c)
          );

          // 檢查被移除的課程
          if (removedCourses.length > 0 && resource.isPublic) {
            // 如果是公開問題，檢查被移除的課程是否都屬於此教師
            const canRemoveAll = removedCourses.every((courseId) =>
              req.user.courses.includes(courseId)
            );
            if (!canRemoveAll) {
              return res.status(403).json({
                success: false,
                msg: "公開資源中嘗試刪除的課程包含非此教師的課程，無法刪除",
              });
            }
          }

          // 檢查新增的課程
          if (addedCourses.length > 0) {
            // 檢查新增的課程是否都屬於此教師
            const canAddAll = addedCourses.every((courseId) =>
              req.user.courses.includes(courseId)
            );
            if (!canAddAll) {
              return res.status(403).json({
                success: false,
                msg: "你嘗試新增的課程中，包含你未註冊的課程",
              });
            }
          }
        }
        return next();
      }

      // 其他請求方法不支援
      return res.status(403).json({ success: false, msg: "教師不支援此操作" });
    }

    // 如果用戶角色不是 admin、student 或 teacher，返回錯誤
    return res.status(403).json({ success: false, msg: "無法辨識的權限" });
  } catch (error) {
    logError(
      {
        userIp: req.ip,
        userId: req.user?._id,
        userName: req.user?.userinfo?.realname,
      },
      "accessChecker.js",
      "updateAndDeleteQuestion middleware",
      {},
      error
    );
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
};

/**
 * 檢查用戶是否為教師
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void|Object} 如果用戶是教師，調用 next()；否則返回錯誤響應
 */
const teacher = async (req, res, next) => {
  try {
    // 檢查用戶是否為學生，如果是則拒絕訪問
    if (req.user.role == "student")
      return res
        .status(403)
        .json({ success: false, msg: "只有老師可以使用此資源" });
    next();
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user?._id,
        userName: req.user?.userinfo?.realname,
      },
      "accessChecker.js",
      "teacher middleware",
      {},
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
};

/**
 * 檢查用戶是否為管理員
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express 下一個中間件函數
 * @returns {void|Object} 如果用戶是管理員，調用 next()；否則返回錯誤響應
 */
const admin = async (req, res, next) => {
  try {
    // 檢查用戶是否為管理員，如果不是則拒絕訪問
    if (req.user.role != "admin")
      return res
        .status(403)
        .json({ success: false, msg: "只有管理員可以使用此資源" });
    next();
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user?._id,
        userName: req.user?.userinfo?.realname,
      },
      "accessChecker.js",
      "admin middleware",
      {},
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
};

module.exports = {
  course,
  teacher,
  admin,
  question,
  updateAndDeleteQuestion,
};
