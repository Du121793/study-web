const router = require("express").Router();
const Course = require("../../models").course;
const User = require("../../models").user;
const modifyCourse = require("../../methods/").modifyCourse;
const vimeoSchedule = require("../../models").vimeoSchedule;
const VideoInfo = require("../../models").courseVideoInfo;
const QAmessage = require("../../models").QAmessage;
const QA = require("../../models").QA;
const videoAccessRoute = require("./videoAccess");
const accessChecker = require("../routesMiddleware/accessChecker");

router.use("/videoAccess", accessChecker.teacher, videoAccessRoute);

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
    newCourse.members.push(req.user._id);
    let savedCourse = await newCourse.save();
    req.user.courses.push(savedCourse._id);
    await req.user.save();

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
    let { user_ids, course_ids } = req.body;

    // 驗證 course_ids 與 user_ids 是否為合法陣列
    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的課程 ID 陣列 (course_ids)"
      });
    }
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的學生 ID 陣列 (user_ids)"
      });
    }

    // 用來儲存每門課程的詳細訊息
    let successMsg = {};
    // 用來計算所有課程成功註冊的總數
    let globalSuccessCount = 0;
    // 每門課程理論上都要處理 user_ids.length 筆註冊
    const totalPossibleRegistrations = course_ids.length * user_ids.length;

    // 依序處理每一門課程
    for (const course_id of course_ids) {
      // 驗證是否有操作此課程的權限（或為 admin）
      if (
        !req.user.courses.find((n) => n == course_id) &&
        req.user.role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          msg: `你沒有為課程 ${course_id} 註冊成員的權限`
        });
      }

      // 取得對應的課程
      let foundCourse = await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(400).json({
          success: false,
          msg: `課程 ID ${course_id} 錯誤`
        });
      }

      let successCount = 0;
      let alreadyRegistered = [];
      let invalidUsers = [];

      // 依序處理每個學生
      for (const user_id of user_ids) {
        let foundStudent = await User.findOne({ _id: user_id }).exec();
        if (!foundStudent) {
          invalidUsers.push(user_id);
          continue;
        }
        if (foundCourse.members.includes(user_id)) {
          alreadyRegistered.push(user_id);
          continue;
        }
        // 加入課程成員，並更新學生的課程資料
        foundCourse.members.push(user_id);
        foundStudent.courses.push(course_id);
        await foundStudent.save();
        successCount++;
      }
      await foundCourse.save();

      globalSuccessCount += successCount;

      // 組成此門課程的狀態訊息
      successMsg[course_id] = {
        registerSuccess: `成功註冊 ${successCount} 位學生到課程 ${foundCourse.courseName}。`,
        alreadyRegistered: alreadyRegistered.length > 0
          ? `以下學生已經註冊過：${alreadyRegistered.join(", ")}。`
          : "",
        invalidUsers: invalidUsers.length > 0
          ? `以下學生 ID 無效：${invalidUsers.join(", ")}。`
          : ""
      };
    }

    // 組成全域訊息：如果所有預期的註冊皆成功則顯示「全部」，否則顯示成功筆數
    let globalMsg = "";
    if (globalSuccessCount === totalPossibleRegistrations) {
      globalMsg = `成功註冊全部學生。`;
    } else {
      globalMsg = `成功註冊 ${globalSuccessCount} 位學生。`;
    }

    return res
      .status(200)
      .json({ success: true, msg: globalMsg, data: { successMsg } });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: "伺服器發生問題，無法成功註冊"
    });
  }
});

router.post("/unRegister", async (req, res) => {
  try {
    let { user_ids, course_ids } = req.body;

    // 驗證 course_ids 與 user_ids 是否為合法陣列
    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的課程 ID 陣列 (course_ids)"
      });
    }
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的學生 ID 陣列 (user_ids)"
      });
    }

    let successMsg = {};
    let globalSuccessCount = 0;
    const totalPossibleUnregistrations = course_ids.length * user_ids.length;

    // 依序處理每一門課程
    for (const course_id of course_ids) {
      // 驗證使用者是否有操作此課程的權限（或為 admin）
      if (
        !req.user.courses.find((n) => n == course_id) &&
        req.user.role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          msg: `你沒有為課程 ${course_id} 註銷成員的權限`
        });
      }

      // 取得對應的課程
      let foundCourse = await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(400).json({
          success: false,
          msg: `課程 ID ${course_id} 錯誤`
        });
      }

      let successCount = 0;
      let notRegistered = [];
      let invalidUsers = [];

      // 依序處理每個學生
      for (const user_id of user_ids) {
        let foundStudent = await User.findOne({ _id: user_id }).exec();
        if (!foundStudent) {
          invalidUsers.push(user_id);
          continue;
        }
        if (!foundCourse.members.includes(user_id)) {
          notRegistered.push(user_id);
          continue;
        }
        // 從學生資料中移除該課程，同時更新課程成員
        foundStudent.courses = foundStudent.courses.filter((n) => n != course_id);
        foundCourse.members = foundCourse.members.filter((n) => n != user_id);
        await foundStudent.save();
        successCount++;
      }
      await foundCourse.save();

      globalSuccessCount += successCount;

      // 組成此門課程的狀態訊息
      successMsg[course_id] = {
        unregisterSuccess: `成功註銷 ${successCount} 位學生從課程 ${foundCourse.courseName}。`,
        notRegistered: notRegistered.length > 0
          ? `以下學生未註冊過：${notRegistered.join(", ")}。`
          : "",
        invalidUsers: invalidUsers.length > 0
          ? `以下學生 ID 無效：${invalidUsers.join(", ")}。`
          : ""
      };
    }

    // 組成全域訊息：如果所有預期的註銷皆成功則顯示「全部」，否則顯示成功筆數
    let globalMsg = "";
    if (globalSuccessCount === totalPossibleUnregistrations) {
      globalMsg = `成功註銷全部學生。`;
    } else {
      globalMsg = `成功註銷 ${globalSuccessCount} 位學生。`;
    }

    return res
      .status(200)
      .json({ success: true, msg: globalMsg, data: { successMsg } });
  } catch (e) {
    return res.status(500).json({
      success: false,
      msg: "很抱歉，註銷發生問題"
    });
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

router.patch("/patchCourse", async (req, res) => {
  try {
    const { courseId, courseName, subject, grade, courseClass } = req.body;
    console.log(courseId);
    console.log(courseName);
    console.log(subject);
    console.log(grade);
    console.log(courseClass);
    // 檢查是否提供 courseId
    if (!courseId)
      return res.status(400).json({ success: false, msg: "缺少課程ID" });

    if (
      req.user.role !== "admin" &&
      !req.user.courses.find((n) => n === course_id)
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有修改此課程的權限" });
    }

    let foundCourse = await Course.findById(courseId).exec();
    if (!foundCourse)
      return res.status(404).json({ success: false, msg: "找不到課程" });

    // 僅取提供的欄位，若未提供則使用原始資料
    const newCourseName =
      courseName !== undefined ? courseName : foundCourse.courseName;
    const newSubject = subject !== undefined ? subject : foundCourse.subject;
    const newGrade = grade !== undefined ? grade : foundCourse.grade;
    const newCourseClass =
      courseClass !== undefined ? courseClass : foundCourse.courseClass;

    // 檢查更新後是否會與其他課程重複（排除當前課程）
    let duplicateCourse = await Course.findOne({
      courseName: newCourseName,
      subject: newSubject,
      grade: newGrade,
      courseClass: newCourseClass,
      _id: { $ne: courseId },
    }).exec();

    if (duplicateCourse)
      return res.status(400).json({
        success: false,
        msg: "已有其他課程具有相同名稱、科目、年級及班級",
      });

    // 更新 modifyCourse 中的相關科目資料
    modifyCourse.addSubject(newGrade, newSubject, newCourseClass);

    // 僅更新提供的部分
    foundCourse.courseName = newCourseName;
    foundCourse.subject = newSubject;
    foundCourse.grade = newGrade;
    foundCourse.courseClass = newCourseClass;
    let savedCourse = await foundCourse.save();
    console.log(savedCourse);
    return res.json({
      success: true,
      msg: "課程更新成功",
      data: savedCourse,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器更新失敗",
    });
  }
});

router.delete("/deleteCourse", async (req, res) => {
  try {
    const { course_id } = req.body;
    let foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "沒有找到所屬課程" });
    let courseName = foundCourse.courseName;

    // 權限檢查：若使用者既非 admin 且不屬於此課程，拒絕操作
    if (
      req.user.role !== "admin" &&
      !req.user.courses.find((n) => n.toString() === course_id.toString())
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有刪除此課程的權限" });
    }

    // Step 1: 針對此課程的影片建立 Vimeo 刪除排程，並刪除 VideoInfo 資料
    const newSchedule = new vimeoSchedule({
      method: "delete",
      videoIndex: { COURSEID: course_id },
    });
    await newSchedule.save();
    await VideoInfo.deleteMany({ courseID: course_id });

    // Step 2: 處理屬於此課程的 QA 資料
    const qas = await QA.find({ courses: course_id });
    for (let qa of qas) {
      // 從 QA 的 courses 陣列中移除該課程 ID
      qa.courses = qa.courses.filter(
        (id) => id.toString() !== course_id.toString()
      );
      // 若移除後 courses 為空，且此 QA 為非公開（isPublic 為 false）
      if (qa.courses.length === 0 && qa.isPublic === false) {
        // 刪除該 QA 的圖片資料夾
        const questionFolder = getQuestionFolder(qa._id);
        if (fs.existsSync(questionFolder)) {
          fs.rmSync(questionFolder, { recursive: true, force: true });
        }
        // 找出該 QA 之所有留言
        const comments = await QAmessage.find({ pointTo: qa._id });
        for (let comment of comments) {
          // 若留言有影片，建立 Vimeo 刪除排程
          if (
            comment.videoURL &&
            Array.isArray(comment.videoURL) &&
            comment.videoURL.length > 0
          ) {
            const newCommentSchedule = new vimeoSchedule({
              method: "delete",
              videoIndex: { commentID: comment._id },
            });
            await newCommentSchedule.save();
          }
          // 刪除留言（留言圖片已隨 QA 圖片資料夾刪除）
          await QAmessage.findByIdAndDelete(comment._id);
        }
        // 刪除該 QA 文件
        await QA.findByIdAndDelete(qa._id);
      } else {
        // 若 QA 仍與其他課程關聯，則僅更新 courses 欄位
        await QA.findByIdAndDelete(qa._id);
      }
    }

    // Step 3: 更新所有該課程成員，從其 courses 陣列中移除此課程
    for (const userID of foundCourse.members) {
      let foundStudent = await User.findOne({ _id: userID });
      if (!foundStudent) continue;
      foundStudent.courses = foundStudent.courses.filter(
        (n) => n.toString() !== course_id.toString()
      );
      await foundStudent.save();
    }

    // Step 4: 刪除課程資料
    await Course.deleteOne({ _id: course_id });

    // 更新 modifyCourse 中的科目資料
    modifyCourse.deleteSubject(
      foundCourse.grade,
      foundCourse.subject,
      foundCourse.courseClass
    );

    res.json({ success: true, msg: `課程 ${courseName} 已成功刪除` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, msg: "很抱歉，伺服器刪除課程失敗" });
  }
});

module.exports = router;
