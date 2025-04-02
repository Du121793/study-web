const Course = require("../../models").course;
const QA = require("../../models").QA;
const mongoose = require("mongoose");

const course = async (req, res, next) => {
  try {
    let { course_id } = req.params;

    if (!course_id || !mongoose.Types.ObjectId.isValid(course_id)) {
      return res.status(400).json({ success: false, msg: "無效的路由" });
    }
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "無法找到課程" });

    if (req.user.role !== "admin") {
      if (!req.user.courses.find((n) => n.toString() == foundCourse._id.toString()))
        return res
          .status(401)
          .json({ success: false, msg: "你沒有訪問此課程的權限" });
    }
    req.course = foundCourse;
    next();
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法訪問此課程" });
  }
};

const question = async (req, res, next) => {
  try {
    let { question_id } = req.params;

    if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
      return res.status(400).json({ success: false, msg: "無效的路由" });
    }

    let foundQuestion = await QA.findOne({ _id: question_id }).exec();
    if (!foundQuestion)
      return res.status(400).json({ success: false, msg: "無法找到課程" });

    if (req.user.role !== "admin") {
      const commonElements = foundQuestion.courses.filter((item) =>
        req.user.courses.includes(item)
      );

      if (commonElements.length === 0 && !foundQuestion.isPublic) {
        return res
          .status(401)
          .json({ success: false, msg: "你沒有訪問此問題的權限" });
      }

      if (foundQuestion.isPublic && req.user.role === "student") {
        return res
          .status(401)
          .json({ success: false, msg: "你沒有訪問此問題的權限" });
      }
    }
    req.question = foundQuestion;
    next();
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法訪問此課程" });
  }
};

const updateAndDeleteQuestion = async (req, res, next) => {
  try {
    const role = req.user.role;
    const updateFields = Object.keys(req.body);
    const qaId = req.body.question_id
      ? req.body.question_id
      : req.query.question_id; // 資源 ID 從路由參數取得

    // 取得資源，若不存在則回傳 404
    const resource = await QA.findById(qaId);
    req.question = resource;
    if (!resource) {
      return res.status(404).json({ success: false, msg: "資源不存在" });
    }

    // ───────────── admin ─────────────
    if (role === "admin") {
      return next(); // admin 不做任何限制
    }

    // ───────────── student ─────────────
    if (role === "student") {
      if (resource.poster != req.user._id) {
        return res.status(401).json({
          success: false,
          msg: `你沒有變更此問題的權限`,
        });
      }
      // 不允許修改的欄位
      const forbiddenKeys = ["isPublic", "replied", "courses", "poster"];
      const invalidKeys = updateFields.filter((key) =>
        forbiddenKeys.includes(key)
      );
      if (invalidKeys.length > 0) {
        return res.status(403).json({
          success: false,
          msg: `學生不能修改這些欄位: ${invalidKeys.join(", ")}`,
        });
      }
      // 若資源已被回覆，則學生無法修改或刪除
      if (resource.replied === true) {
        return res.status(403).json({
          success: false,
          msg: "資源已被回覆，無法修改或刪除",
        });
      }
      // 學生僅允許修改的欄位
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

    // ───────────── teacher ─────────────
    if (role === "teacher") {
      if (
        !req.question.courses.some((item) => req.user.courses.includes(item))
      ) {
        return res.status(401).json({
          success: false,
          msg: `你不屬於本課程`,
        });
      }

      if (req.method === "DELETE") {
        // 刪除動作 (DELETE)
        // 若資源是公開的，檢查 resource.courses 是否都屬於此老師
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

      // 更新動作 (PUT)
      if (req.method === "PUT" || req.method === "PATCH") {
        // 教師允許修改的欄位
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

        // 若更新中包含 courses 欄位，需做進階檢查
        if (updateFields.includes("courses")) {
          if (!Array.isArray(req.body.courses)) {
            return res.status(400).json({
              success: false,
              msg: "courses 必須為陣列",
            });
          }

          const oldCourses = resource.courses; // 更新前的課程列表
          const newCourses = req.body.courses; // 更新後的課程列表

          // 計算「被移除」與「被新增」的課程
          const removedCourses = oldCourses.filter(
            (c) => !newCourses.includes(c)
          );
          const addedCourses = newCourses.filter(
            (c) => !oldCourses.includes(c)
          );

          // ───── 被移除的課程 ─────
          if (removedCourses.length > 0 && resource.isPublic) {
            // 資源是公開時，檢查被移除的課程是否都屬於此教師
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

          // ───── 被新增的課程 ─────
          if (addedCourses.length > 0) {
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

      // 其餘方法 (PATCH, POST, etc.) 不支援
      return res.status(403).json({ success: false, msg: "教師不支援此操作" });
    }

    // 若角色非 admin/student/teacher，回傳錯誤
    return res.status(403).json({ success: false, msg: "無法辨識的權限" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
};

const teacher = (req, res, next) => {
  if (req.user.role == "student")
    return res
      .status(401)
      .json({ success: false, msg: "只有老師可以使用此資源" });
  next();
};

const admin = (req, res, next) => {
  if (req.user.role != "admin")
    return res
      .status(401)
      .json({ success: false, msg: "只有管理員可以使用此資源" });
  next();
};

module.exports = {
  course,
  teacher,
  admin,
  question,
  updateAndDeleteQuestion,
};
