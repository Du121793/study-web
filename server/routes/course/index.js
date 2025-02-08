const router = require("express").Router();
const Course = require("../../models").course;
const courseMethodRouter = require("./courseMethod");
const modifyCourseRouter = require("./modifyCourse");

const checkTeacherAccess = (req, res, next) => {
  if (req.user.role != "teacher")
    return res.status(401).send("只有老師可以使用此資源");
  next();
};

const checkCourseAccess = async (req, res, next) => {
  try {
    let { course_id } = req.params;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();

    if (req.user.role == "student") {
      if (!foundCourse.members.find((n) => n == req.user._id))
        return res.status(401).send("你沒有訪問此課程的權限");
    }
    if (!foundCourse) return res.status(400).send("無法找到課程");

    req.course = foundCourse;
    next();
  } catch (e) {
    return res.status(500).send("很抱歉，伺服器無法訪問此課程");
  }
};

router.get("/getCourses", checkTeacherAccess, async (req, res) => {
  try {
    const { courseName, subject, grade, courseClass, members, _id } = req.query;

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
      filter.courses = members;
    }

    const Courses = await Course.find(filter);
    return res.json(Courses);
  } catch (error) {
    return res.status(500).send("發生了不可預期的錯誤");
  }
});

router.use("/modifyCourse", checkTeacherAccess, modifyCourseRouter);

router.use("/:course_id", checkCourseAccess, courseMethodRouter);

module.exports = router;
