const router = require("express").Router();
const Course = require("../../models").course;
const courseMethodRouter = require("./courseMethod");
const modifyCourseRouter = require("./modifyCourse");

const checkTeacherAccess = (req, res, next) => {
  if (req.user.role != "teacher")
    return res
      .status(401)
      .json({ success: false, msg: "只有老師可以使用此資源" });
  next();
};

const checkCourseAccess = async (req, res, next) => {
  try {
    let { course_id } = req.params;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();

    if (req.user.role == "student") {
      if (!foundCourse.members.find((n) => n == req.user._id))
        return res
          .status(401)
          .json({ success: false, msg: "你沒有訪問此課程的權限" });
    }
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "無法找到課程" });

    req.course = foundCourse;
    next();
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法訪問此課程" });
  }
};

router.get("/getCourses", checkTeacherAccess, async (req, res) => {
  try {
    const {
      courseName,
      subject,
      grade,
      courseClass,
      members,
      _id,
      page,
      pageSize,
    } = req.query;

    const currentPage = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 10;

    const filter = {};

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

    const total = await Course.countDocuments(filter);

    if (!(page && pageSize)) {
      const courses = await Course.find(filter);
      return res.json({
        success: true,
        data: { total, currentPage: 1, pageSize: null, courses },
      });
    }

    const skip = (currentPage - 1) * limit;
    const courses = await Course.find(filter).skip(skip).limit(limit);

    return res.json({
      success: true,
      data: { total, currentPage, pageSize: limit, courses },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.use("/modifyCourse", checkTeacherAccess, modifyCourseRouter);

router.use("/:course_id", checkCourseAccess, courseMethodRouter);

module.exports = router;
