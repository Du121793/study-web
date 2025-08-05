/**
 * @file index.js
 * @description 課程相關路由處理，包含課程查詢、修改和問答功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */
const router = require("express").Router();
const Course = require("../../models").course;
const User = require("../../models").user;
const courseMethodRouter = require("./courseMethod");
const modifyCourseRouter = require("./modifyCourse");
const QARouter = require("./QA");
const { log, logError } = require("../../utils/logger");

const accessChecker = require("../routesMiddleware/accessChecker");

const checkTeacherAccess = accessChecker.teacher;
const checkCourseAccess = accessChecker.course;

// =====================
// 路由配置
// =====================

// 問答相關路由
router.use("/question", QARouter);

// 課程修改相關路由（需要教師權限）
router.use("/modifyCourse", checkTeacherAccess, modifyCourseRouter);

/**
 * 獲取課程列表
 * @route GET /getCourses
 * @param {string} courseName - 課程名稱過濾
 * @param {string} subject - 科目過濾
 * @param {string} grade - 年級過濾
 * @param {string} courseClass - 班級過濾
 * @param {string} _id - 課程ID過濾
 * @param {number} page - 頁碼
 * @param {number} pageSize - 每頁筆數
 * @returns {Object} 課程列表及分頁資訊
 */
router.get("/getCourses", checkTeacherAccess, async (req, res) => {
  try {
    // 解析查詢參數
    const {
      courseName, // 課程名稱
      subject, // 科目
      grade, // 年級
      courseClass, // 班級
      _id, // 課程 ID
      page, // 分頁頁數
      pageSize, // 每頁筆數
    } = req.query;

    // 設定分頁參數
    const currentPage = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 10;

    // 建立過濾條件
    const filter = {};

    // 處理過濾條件
    if (_id) filter._id = _id;
    if (courseName) filter.courseName = courseName;
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (courseClass) filter.courseClass = courseClass;

    // 處理非管理員的課程訪問限制
    if (req.user.role !== "admin") {
      if (filter._id) {
        // 檢查指定課程是否在用戶已註冊課程中
        if (!req.user.courses.includes(filter._id)) {
          filter._id = { $in: [] }; // 設置空結果
        }
      } else {
        // 限制只能查看已註冊的課程
        filter._id = { $in: req.user.courses };
      }
    }

    // 獲取總筆數
    const total = await Course.countDocuments(filter);
    const totalPage = parseInt(total / pageSize) + 1;

    // 處理不分頁的情況
    if (!(page && pageSize)) {
      const courses = await Course.find(filter).populate(
        "teacher",
        "_id userinfo.username userinfo.pictureUrl"
      );
      return res.json({
        success: true,
        data: { total, currentPage: 1, pageSize: null, courses },
      });
    }

    // 執行分頁查詢
    const skip = (currentPage - 1) * limit;
    const courses = await Course.find(filter)
      .populate("teacher", "_id userinfo.username userinfo.pictureUrl")
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: { total, totalPage, currentPage, pageSize: limit, courses },
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "course/index.js",
      "GET /getCourses",
      req.query,
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

router.get("/getGrades", checkTeacherAccess, async (req, res) => {
  try {
    const grades = await User.distinct("userinfo.grade");
    res.json({
      success: true,
      data: { grades },
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "course/index.js",
      "GET /getGrades",
      req.query,
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

// 課程方法相關路由（需要課程訪問權限）
router.use("/:course_id", checkCourseAccess, courseMethodRouter);

module.exports = router;
