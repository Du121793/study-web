const router = require("express").Router();
const Course = require("../models").course;
const User = require("../models/").user;

const checkTeacherAccess = (req, res, next) => {
  if (req.user.role != "teacher")
    return res.status(401).send("只有老師可以使用此資源");
  next();
};

router.get("/", (req, res) => {
  try {
    return res.send(req.user);
  } catch (e) {
    return res.status(500).send("發生了不可預期的錯誤");
  }
});

router.get("/registedCourse", async (req, res) => {
  try {
    const coursesInfo = await Promise.all(
      req.user.courses.map(async (courseID) => {
        const foundCourse = await Course.findOne({ _id: courseID });
        return foundCourse;
      })
    );

    console.log(coursesInfo);
    return res.send(coursesInfo);
  } catch (e) {
    console.error(e);
    return res.status(500).send("發生了不可預期的錯誤");
  }
});

router.get("/getMembers", checkTeacherAccess, async (req, res) => {
  try {
    const { username, phoneNumber, _id, role, courses } = req.query;

    const filter = {};

    if (username) {
      filter["userinfo.username"] = new RegExp(username, "i");
    }

    if (phoneNumber) {
      filter["userinfo.phoneNumber"] = new RegExp(phoneNumber, "i");
    }

    if (_id) {
      filter._id = _id;
    }

    if (role) {
      filter.role = role;
    }

    if (courses) {
      filter.courses = courses;
    }

    const students = await User.find(filter);
    return res.json(students);
  } catch (error) {
    return res.status(500).send("發生了不可預期的錯誤");
  }
});

module.exports = router;
