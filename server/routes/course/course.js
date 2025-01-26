const router = require("express").Router();
const User = require("../../models").user;
const Course = require("../../models").course;
const courseMethodRouter = require("./courseMethod");

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

router.post("/createNewCourse", checkTeacherAccess, async (req, res) => {
  const { courseName, subject, grade, courseClass } = req.body;
  let foundCourse = await Course.findOne({
    courseName,
    subject,
    grade,
    courseClass,
  }).exec();

  if (foundCourse)
    return res.status(400).send("你已經有一樣名稱，科目，年級，班級的課程了");

  let newCourse = new Course({ courseName, subject, grade, courseClass });
  try {
    let savedCourse = newCourse.save();
    return res.send({
      msg: "課程註冊完畢",
      savedCourse,
    });
  } catch (e) {
    return res.status(500).send("很抱歉，伺服器儲存失敗");
  }
});

router.post("/register", checkTeacherAccess, async (req, res) => {
  try {
    let { user_id, course_id } = req.body;
    let foundStudent = await User.findOne({ _id: user_id }).exec();
    let foundCourse = await Course.findOne({ _id: course_id });
    console.log(foundCourse);

    if (!(foundStudent && foundCourse))
      return res.status(400).send("學生或課程id錯誤");
    if (foundCourse.members.find((n) => n === user_id))
      return res.status(400).send("此用戶已註冊此課程");

    foundCourse.members.push(user_id);
    await foundCourse.save();

    return res
      .status(200)
      .send(`用戶已成功註冊 ${foundCourse.courseName} 課程`);
  } catch (e) {
    return res.status(500).send("很抱歉，註冊發生問題" + e);
  }
});

router.post("/unregister", checkTeacherAccess, async (req, res) => {
  try {
    let { user_id, course_id } = req.body;
    console.log(user_id, course_id);
    let foundStudent = await User.findOne({ _id: user_id }).exec();
    console.log(foundStudent);
    let foundCourse = await Course.findOne({ _id: course_id });

    if (!(foundStudent && foundCourse))
      return res.status(400).send("學生或課程id錯誤");
    if (!foundCourse.members.find((n) => n === user_id))
      return res.status(400).send("此用戶沒有註冊此課程");

    foundCourse.members = foundCourse.members.filter((n) => n != user_id);
    await foundCourse.save();

    return res
      .status(200)
      .send(`用戶已成功註銷 ${foundCourse.courseName} 課程`);
  } catch (e) {
    return res.status(500).send("很抱歉，註銷發生問題" + e);
  }
});

const modifyCourse = require("../../methods/").modifyCourse;

router.post("/findJoinedSubject", checkTeacherAccess, (req, res) => {
  try {
    const { grade } = req.body;
    const foundSubject = modifyCourse.findSubject(grade);
    return res.send(foundSubject);
  } catch (e) {
    return res.send("很抱歉，伺服器無法處理此請求");
  }
});

router.delete("/deleteCourse", checkTeacherAccess, async (req, res) => {
  try {
    let { course_id } = req.body;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse) return res.status(400).send("沒有找到所屬課程");
    let courseName = foundCourse.courseName;
    await Course.deleteOne({ _id: course_id });
    res.send(`課程 ${courseName} 已成功刪除`);
  } catch (e) {
    res.status(500).send("很抱歉，伺服器刪除課程失敗");
  }
});

router.use("/:course_id", checkCourseAccess, courseMethodRouter);

module.exports = router;
