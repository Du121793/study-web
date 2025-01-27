const router = require("express").Router();
const Course = require("../../models").course;
const User = require("../../models").user;
const modifyCourse = require("../../methods/").modifyCourse;
const VimeoMethods = require("../../methods").vimeoMethods;
const VideoInfo = require("../../models").courseVideoInfo;
const mongoose = require("mongoose");

router.post("/createNewCourse", async (req, res) => {
  try {
    const { courseName, subject, grade, courseClass } = req.body;

    if (!(courseName && subject && grade && courseClass))
      return res.status(400).send("資料提供不完整");

    let foundCourse = await Course.findOne({
      courseName,
      subject,
      grade,
      courseClass,
    }).exec();

    if (foundCourse)
      return res.status(400).send("你已經有一樣名稱，科目，年級，班級的課程了");

    modifyCourse.addSubject(grade, subject);

    let newCourse = new Course({ courseName, subject, grade, courseClass });

    let savedCourse = await newCourse.save();
    return res.send({
      msg: "課程註冊完畢",
      savedCourse,
    });
  } catch (e) {
    return res.status(500).send("很抱歉，伺服器儲存失敗");
  }
});

router.post("/register", async (req, res) => {
  try {
    let { user_ids, course_id } = req.body; // 假設傳入的 user_ids 是一個陣列
    console.log(user_ids);

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).send("請提供有效的學生 ID 陣列");
    }

    let foundCourse = await Course.findOne({ _id: course_id });
    if (!foundCourse) {
      return res.status(400).send("課程 ID 錯誤");
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

    return res.status(200).send(responseMessage);
  } catch (e) {
    return res.status(500).send("很抱歉，註冊發生問題: " + e);
  }
});

router.post("/unregister", async (req, res) => {
  try {
    let { user_ids, course_id } = req.body; // 假設傳入的 user_ids 是一個陣列
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).send("請提供有效的學生 ID 陣列");
    }

    let foundCourse = await Course.findOne({ _id: course_id });
    if (!foundCourse) {
      return res.status(400).send("課程 ID 錯誤");
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

      foundCourse.members = foundCourse.members.filter((n) => n != user_id);
      successCount++;
    }

    await foundCourse.save();

    let responseMessage = `成功註銷 ${successCount} 位學生從課程 ${foundCourse.courseName}。\n`;

    if (notRegistered.length > 0) {
      responseMessage += `以下學生未註冊過：${notRegistered.join(", ")}。\n`;
    }

    if (invalidUsers.length > 0) {
      responseMessage += `以下學生 ID 無效：${invalidUsers.join(", ")}。\n`;
    }

    return res.status(200).send(responseMessage);
  } catch (e) {
    return res.status(500).send("很抱歉，註銷發生問題: " + e);
  }
});

router.post("/findJoinedSubject", (req, res) => {
  try {
    const { grade } = req.body;
    const foundSubject = modifyCourse.findSubject(grade);
    return res.send(foundSubject);
  } catch (e) {
    return res.send("很抱歉，伺服器無法處理此請求");
  }
});

router.delete("/deleteCourse", async (req, res) => {
  try {
    let { course_id } = req.body;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse) return res.status(400).send("沒有找到所屬課程");
    let courseName = foundCourse.courseName;

    console.log(await VimeoMethods.delete("", course_id));
    console.log(
      await VideoInfo.deleteMany({
        courseID: course_id,
      })
    );
    await Course.deleteOne({ _id: course_id });
    modifyCourse.deleteSubject(foundCourse.grade, foundCourse.subject);

    res.send(`課程 ${courseName} 已成功刪除`);
  } catch (e) {
    res.status(500).send("很抱歉，伺服器刪除課程失敗" + e);
  }
});

module.exports = router;
