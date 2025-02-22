const router = require("express").Router();
const Course = require("../../models").course;
const User = require("../../models").user;
const modifyCourse = require("../../methods/").modifyCourse;
const VimeoMethods = require("../../methods").vimeoMethods;
const VideoInfo = require("../../models").courseVideoInfo;

const accessChecker = require("../routesMiddleware/accessChecker");
const checkCourseAccess = accessChecker.course;

router.post("/createNewCourse", async (req, res) => {
  try {
    const { courseName, subject, grade, courseClass } = req.body;
    console.log(courseName, subject, grade, courseClass);
    if (!(courseName && subject && grade && courseClass))
      return res.status(400).json({ success: false, msg: "資料提供不完整" });

    let foundCourse = await Course.findOne({
      courseName,
      subject,
      grade,
      courseClass,
    }).exec();

    if (foundCourse)
      return res.status(400).json({
        success: false,
        msg: "你已經有一樣名稱，科目，年級，班級的課程了",
      });

    modifyCourse.addSubject(grade, subject, courseClass);

    let newCourse = new Course({
      courseName,
      subject,
      grade,
      courseClass,
      members: [],
    });
    if (req.user.role !== "admin") {
      newCourse.members.push(req.user._id);
      let savedCourse = await newCourse.save();
      req.user.courses.push(savedCourse._id);
      await req.user.save();
    }

    return res.json({
      success: true,
      msg: "課程創建完畢",
      data: savedCourse,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器儲存失敗",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    let { user_ids, course_id } = req.body; // 假設傳入的 user_ids 是一個陣列

    if (
      !req.user.courses.find((n) => n == course_id) &&
      req.user.role !== "admin"
    )
      return res
        .status(400)
        .json({ success: false, msg: "你沒有為此課程註冊成員的權限" });

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供有效的學生 ID 陣列" });
    }

    let foundCourse = await Course.findOne({ _id: course_id });
    if (!foundCourse) {
      return res.status(400).json({ success: false, msg: "課程 ID 錯誤" });
    }

    let successCount = 0;
    let alreadyRegistered = [];
    let invalidUsers = [];

    for (const user_id of user_ids) {
      let foundStudent = await User.findOne({ _id: user_id }).exec();

      if (!foundStudent) {
        invalidUsers.push(user_id); // 無效的學生 ID
        continue;
      }
      if (foundCourse.members.includes(user_id)) {
        alreadyRegistered.push(user_id); // 已註冊的學生
        continue;
      }

      foundCourse.members.push(user_id);
      foundStudent.courses.push(course_id);

      await foundStudent.save();

      successCount++;
    }

    await foundCourse.save();

    let responseMessage = `成功註冊 ${successCount} 位學生到課程 ${foundCourse.courseName}。\n`;

    if (alreadyRegistered.length > 0) {
      responseMessage += `以下學生已經註冊過：${alreadyRegistered.join(
        ", "
      )}。\n`;
    }

    if (invalidUsers.length > 0) {
      responseMessage += `以下學生 ID 無效：${invalidUsers.join(", ")}。\n`;
    }

    return res.status(200).json({ success: true, data: responseMessage });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器發生問題，無法成功註冊" });
  }
});

router.post("/unRegister", async (req, res) => {
  try {
    let { user_ids, course_id } = req.body; // 假設傳入的 user_ids 是一個陣列

    if (
      !req.user.courses.find((n) => n == course_id) &&
      req.user.role !== "admin"
    )
      return res
        .status(400)
        .json({ success: false, msg: "你沒有為此課程註銷成員的權限" });

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供有效的學生 ID 陣列" });
    }

    let foundCourse = await Course.findOne({ _id: course_id });
    if (!foundCourse) {
      return res.status(400).json({ success: false, msg: "課程 ID 錯誤" });
    }

    let successCount = 0;
    let notRegistered = [];
    let invalidUsers = [];

    for (const user_id of user_ids) {
      let foundStudent = await User.findOne({ _id: user_id }).exec();

      if (!foundStudent) {
        invalidUsers.push(user_id); // 無效的學生 ID
        continue;
      }

      if (!foundCourse.members.includes(user_id)) {
        notRegistered.push(user_id); // 未註冊的學生
        continue;
      }

      foundStudent.courses = foundStudent.courses.filter((n) => n != course_id);
      foundCourse.members = foundCourse.members.filter((n) => n != user_id);
      successCount++;
      await foundStudent.save();
    }

    await foundCourse.save();

    let responseMessage = `成功註銷 ${successCount} 位學生從課程 ${foundCourse.courseName}。\n`;

    if (notRegistered.length > 0) {
      responseMessage += `以下學生未註冊過：${notRegistered.join(", ")}。\n`;
    }

    if (invalidUsers.length > 0) {
      responseMessage += `以下學生 ID 無效：${invalidUsers.join(", ")}。\n`;
    }

    return res.status(200).json({ success: true, data: responseMessage });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，註銷發生問題" });
  }
});

router.get("/findJoinedSubject", (req, res) => {
  try {
    const { grade, subject } = req.query;
    // 或者 const { grade, subject } = req.params; 看你如何設定路由

    const foundSubject = modifyCourse.findSubject(grade, subject);
    console.log(foundSubject); // 這裡會在後端 console 印出純陣列
    return res.json({ success: true, data: foundSubject }); // 回傳 JSON 給前端
  } catch (e) {
    return res.status(500).json({ success: false, msg: "伺服器錯誤" });
  }
});

router.delete("/deleteCourse", async (req, res) => {
  try {
    let { course_id } = req.body;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "沒有找到所屬課程" });
    let courseName = foundCourse.courseName;

    if (
      req.user.role !== "admin" &&
      !req.user.courses.find((n) => n === course_id)
    )
      console.log(await VimeoMethods.delete("", course_id));
    console.log(
      await VideoInfo.deleteMany({
        courseID: course_id,
      })
    );
    for (userID of foundCourse.members) {
      let foundRegistedUser = await User.findOne({ _id: userID });
      console.log(foundRegistedUser);
      if (!foundRegistedUser) {
        console.log(
          "User:" + userID + "unable to unregister\nIs this user really exist?"
        );
        continue;
      }
      foundRegistedUser.courses = foundRegistedUser.courses.filter(
        (n) => n != course_id
      );
      await foundRegistedUser.save();
    }
    await Course.deleteOne({ _id: course_id });

    modifyCourse.deleteSubject(
      foundCourse.grade,
      foundCourse.subject,
      foundCourse.courseClass
    );

    res.json({ success: true, msg: `課程 ${courseName} 已成功刪除` });
  } catch (e) {
    res.status(500).json({ success: false, msg: "很抱歉，伺服器刪除課程失敗" });
  }
});

module.exports = router;
