const Course = require("../../models").course;

const course = async (req, res, next) => {
  try {
    let { course_id } = req.params;

    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "無法找到課程" });

    if (req.user.role !== "admin") {
      if (!foundCourse.members.find((n) => n == req.user._id))
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

const teacher = (req, res, next) => {
  if (req.user.role == "student")
    return res.status(401).send("只有老師可以使用此資源");
  next();
};

const admin = (req, res, next) => {
  if (req.user.role != "admin")
    return res.status(401).send("只有管理員可以使用此資源");
  next();
};

module.exports = {
  course,
  teacher,
  admin,
};
