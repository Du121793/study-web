const router = require("express").Router();
const Course = require("../../models").course;
const courseMethodRouter = require("./courseMethod");
const modifyCourseRouter = require("./modifyCourse");

const accessChecker = require("../routesMiddleware/accessChecker");

const checkAdminAccess = accessChecker.admin;
const checkTeacherAccess = accessChecker.teacher;
const checkCourseAccess = accessChecker.course;

router.get("/getCourses", checkAdminAccess, async (req, res) => {
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
