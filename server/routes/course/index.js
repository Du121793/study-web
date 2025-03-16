const router = require("express").Router();
const Course = require("../../models").course;
const QA = require("../../models").QA;
const courseMethodRouter = require("./courseMethod");
const modifyCourseRouter = require("./modifyCourse");
const QARouter = require("./QA");

const accessChecker = require("../routesMiddleware/accessChecker");

const checkTeacherAccess = accessChecker.teacher;
const checkCourseAccess = accessChecker.course;

router.use("/question", QARouter);

router.use("/modifyCourse", checkTeacherAccess, modifyCourseRouter);

router.get("/getCourses", checkTeacherAccess, async (req, res) => {
  try {
    // 從 query 參數中取得各個搜尋條件與分頁資訊
    const {
      courseName, // 課程名稱
      subject, // 科目
      grade, // 年級
      courseClass, // 班級
      members, // 成員
      _id, // 課程 ID，若傳入則搜尋特定課程
      page, // 分頁頁數
      pageSize, // 每頁筆數
    } = req.query;

    // 設定分頁預設值：page 預設為 1，pageSize 預設為 10
    const currentPage = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 10;

    // 建立搜尋條件的物件
    const filter = {};

    // 若有傳入 _id 或其他搜尋條件，則加入至 filter 中
    if (_id) {
      filter._id = _id;
    }
    if (courseName) {
      filter.courseName = courseName;
    }
    if (subject) {
      filter.subject = subject;
    }
    if (grade) {
      filter.grade = grade;
    }
    if (courseClass) {
      filter.courseClass = courseClass;
    }
    if (members) {
      filter.members = members;
    }

    // 當使用者的 role 不是 admin 時，僅限搜尋使用者已註冊的課程
    if (req.user.role !== "admin") {
      if (filter._id) {
        // 如果使用者指定了 _id，確認該 _id 是否屬於使用者已註冊的課程
        if (!req.user.courses.includes(filter._id)) {
          // 如果不在，則設置條件使查詢結果為空
          filter._id = { $in: [] };
        }
      } else {
        // 若未指定 _id，則僅搜尋使用者已註冊的課程
        filter._id = { $in: req.user.courses };
      }
    }

    // 取得符合條件的總筆數
    const total = await Course.countDocuments(filter);

    // 若未提供 page 與 pageSize，則回傳所有資料，不做分頁
    if (!(page && pageSize)) {
      const courses = await Course.find(filter);
      return res.json({
        success: true,
        data: { total, currentPage: 1, pageSize: null, courses },
      });
    }

    // 計算跳過的筆數，並取得分頁後的資料
    const skip = (currentPage - 1) * limit;
    const courses = await Course.find(filter).skip(skip).limit(limit);

    return res.json({
      success: true,
      data: { total, currentPage, pageSize: limit, courses },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.use("/:course_id", checkCourseAccess, courseMethodRouter);

module.exports = router;
