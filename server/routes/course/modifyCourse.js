/**
 * @file modifyCourse.js
 * @description 課程修改相關路由處理，包含課程創建、註冊學生、註銷學生等功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const Course = require("../../models").course;
const User = require("../../models").user;
const videoAccessRoute = require("./videoAccess");
const accessChecker = require("../routesMiddleware/accessChecker");

/**
 * 獲取問題圖片基礎路徑
 * @returns {string} 問題圖片的基礎路徑
 */
function getBaseImagePath() {
  return path.join(__dirname, "../../../resource/questionIMG");
}

/**
 * 獲取特定問題的圖片文件夾路徑
 * @param {string} questionId - 問題ID
 * @returns {string} 問題圖片文件夾的完整路徑
 */
function getQuestionFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

// =====================
// 路由配置
// =====================

// 視頻訪問權限相關路由（需要教師權限）
router.use("/videoAccess", accessChecker.teacher, videoAccessRoute);

/**
 * 創建新課程
 * @route POST /createNewCourse
 * @param {string} courseName - 課程名稱
 * @param {string} subject - 科目
 * @param {string} grade - 年級
 * @param {string} courseClass - 班級
 * @param {string} [teacherId] - 指定教師ID（僅管理員可指定）
 * @returns {Object} 創建結果
 */
router.post("/createNewCourse", async (req, res) => {
  try {
    const { courseName, subject, grade, courseClass, teacherId } = req.body;
    console.log(courseName, subject, grade, courseClass, teacherId);

    // 驗證必要參數
    if (!(courseName && subject && grade && courseClass))
      return res.status(400).json({ success: false, msg: "資料提供不完整" });

    // 檢查課程是否已存在
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

    let teacherToAssign;

    // 如果是管理員且有指定教師
    if (req.user.role === "admin" && teacherId) {
      // 檢查指定的教師是否存在且具有適當的角色
      const specifiedTeacher = await User.findById(teacherId);
      if (!specifiedTeacher) {
        return res.status(400).json({
          success: false,
          msg: "指定的教師不存在",
        });
      }
      if (!["teacher", "admin"].includes(specifiedTeacher.role)) {
        return res.status(400).json({
          success: false,
          msg: "指定的用戶必須是教師或管理員",
        });
      }
      teacherToAssign = teacherId;
    }
    // 其他類型則使用自己的ID
    teacherToAssign = req.user._id;

    // 創建新課程
    let newCourse = new Course({
      courseName,
      subject,
      grade,
      courseClass,
      teacher: teacherToAssign,
    });
    let savedCourse = await newCourse.save();

    // 更新教師的課程列表
    const teacher = await User.findById(teacherToAssign);
    teacher.courses.push(savedCourse._id);
    await teacher.save();

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

/**
 * 註冊學生到課程
 * @route POST /register
 * @param {string[]} user_ids - 學生ID陣列
 * @param {string[]} course_ids - 課程ID陣列
 * @returns {Object} 註冊結果統計
 */
router.post("/register", async (req, res) => {
  try {
    let { user_ids, course_ids } = req.body;

    // 驗證輸入參數
    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的課程 ID 陣列 (course_ids)",
      });
    }
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的學生 ID 陣列 (user_ids)",
      });
    }

    // 初始化結果統計
    let successMsg = {};
    let globalSuccessCount = 0;
    const totalPossibleRegistrations = course_ids.length * user_ids.length;

    // 處理每個課程
    for (const course_id of course_ids) {
      // 檢查權限
      if (
        !req.user.courses.find((n) => n == course_id) &&
        req.user.role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          msg: `你沒有為課程 ${course_id} 註冊成員的權限`,
        });
      }

      // 獲取課程信息
      let foundCourse = await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(400).json({
          success: false,
          msg: `課程 ID ${course_id} 錯誤`,
        });
      }

      // 初始化課程統計
      let successCount = 0;
      let alreadyRegistered = [];
      let invalidUsers = [];

      // 處理每個學生
      for (const user_id of user_ids) {
        let foundStudent = await User.findOne({ _id: user_id })
          .select("_id userinfo.username userinfo.pictureUrl")
          .exec();
        if (!foundStudent) {
          invalidUsers.push(user_id);
          continue;
        }
        if (foundStudent.courses.includes(foundCourse._id)) {
          alreadyRegistered.push(user_id);
          continue;
        }
        // 註冊學生
        foundStudent.courses.push(course_id);
        await foundStudent.save();
        successCount++;
      }

      globalSuccessCount += successCount;

      // 記錄課程處理結果
      successMsg[course_id] = {
        registerSuccess: `成功註冊 ${successCount} 位學生到課程 ${foundCourse.courseName}。`,
        alreadyRegistered:
          alreadyRegistered.length > 0
            ? `以下學生已經註冊過：${alreadyRegistered.join(", ")}。`
            : "",
        invalidUsers:
          invalidUsers.length > 0
            ? `以下學生 ID 無效：${invalidUsers.join(", ")}。`
            : "",
      };
    }

    // 生成總體結果消息
    let globalMsg =
      globalSuccessCount === totalPossibleRegistrations
        ? `成功註冊全部學生。`
        : `成功註冊 ${globalSuccessCount} 位學生。`;

    return res
      .status(200)
      .json({ success: true, msg: globalMsg, data: { successMsg } });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: "伺服器發生問題，無法成功註冊",
    });
  }
});

/**
 * 從課程中註銷學生
 * @route POST /unRegister
 * @param {string[]} user_ids - 學生ID陣列
 * @param {string[]} course_ids - 課程ID陣列
 * @returns {Object} 註銷結果統計
 */
router.post("/unRegister", async (req, res) => {
  try {
    let { user_ids, course_ids } = req.body;

    // 驗證輸入參數
    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的課程 ID 陣列 (course_ids)",
      });
    }
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供有效的學生 ID 陣列 (user_ids)",
      });
    }

    // 初始化結果統計
    let successMsg = {};
    let globalSuccessCount = 0;
    const totalPossibleUnregistrations = course_ids.length * user_ids.length;

    // 處理每個課程
    for (const course_id of course_ids) {
      // 檢查權限
      if (
        !req.user.courses.find((n) => n == course_id) &&
        req.user.role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          msg: `你沒有為課程 ${course_id} 註銷成員的權限`,
        });
      }

      // 獲取課程信息
      let foundCourse = await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(400).json({
          success: false,
          msg: `課程 ID ${course_id} 錯誤`,
        });
      }

      // 初始化課程統計
      let successCount = 0;
      let notRegistered = [];
      let invalidUsers = [];

      // 處理每個學生
      for (const user_id of user_ids) {
        let foundStudent = await User.findOne({ _id: user_id }).exec();
        if (!foundStudent) {
          invalidUsers.push(user_id);
          continue;
        }
        if (!foundStudent.courses.includes(foundCourse._id)) {
          notRegistered.push(user_id);
          continue;
        }
        // 註銷學生
        foundStudent.courses = foundStudent.courses.filter(
          (n) => n != course_id
        );
        await foundStudent.save();
        successCount++;
      }
      await foundCourse.save();

      globalSuccessCount += successCount;

      // 記錄課程處理結果
      successMsg[course_id] = {
        unregisterSuccess: `成功註銷 ${successCount} 位學生從課程 ${foundCourse.courseName}。`,
        notRegistered:
          notRegistered.length > 0
            ? `以下學生未註冊過：${notRegistered.join(", ")}。`
            : "",
        invalidUsers:
          invalidUsers.length > 0
            ? `以下學生 ID 無效：${invalidUsers.join(", ")}。`
            : "",
      };
    }

    // 生成總體結果消息
    let globalMsg =
      globalSuccessCount === totalPossibleUnregistrations
        ? `成功註銷全部學生。`
        : `成功註銷 ${globalSuccessCount} 位學生。`;

    return res
      .status(200)
      .json({ success: true, msg: globalMsg, data: { successMsg } });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: "伺服器發生問題，無法成功註銷",
    });
  }
});

/**
 * 更新課程信息
 * @route PATCH /patchCourse
 * @param {string} courseId - 課程ID
 * @param {string} [courseName] - 新的課程名稱（可選）
 * @param {string} [subject] - 新的科目（可選）
 * @param {string} [grade] - 新的年級（可選）
 * @param {string} [courseClass] - 新的班級（可選）
 * @param {string} [teacherId] - 新的教師ID（僅管理員可指定）
 * @returns {Object} 更新後的課程信息
 */
router.patch("/patchCourse", async (req, res) => {
  try {
    const { courseId, courseName, subject, grade, courseClass, teacherId } =
      req.body;

    // 驗證課程ID
    if (!courseId)
      return res.status(400).json({ success: false, msg: "缺少課程ID" });

    // 獲取課程信息
    let foundCourse = await Course.findById(courseId).exec();
    if (!foundCourse)
      return res.status(404).json({ success: false, msg: "找不到課程" });

    // 檢查權限
    if (
      req.user.role !== "admin" &&
      !req.user.courses.find((n) => n === course_id)
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有修改此課程的權限" });
    }

    // 準備更新數據
    const newCourseName =
      courseName !== undefined ? courseName : foundCourse.courseName;
    const newSubject = subject !== undefined ? subject : foundCourse.subject;
    const newGrade = grade !== undefined ? grade : foundCourse.grade;
    const newCourseClass =
      courseClass !== undefined ? courseClass : foundCourse.courseClass;

    // 檢查是否與其他課程重複
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

    // 處理教師變更（僅管理員可操作）
    if (teacherId) {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          msg: "只有管理員可以更改課程教師",
        });
      }

      // 檢查指定的教師是否存在且具有適當的角色
      const specifiedTeacher = await User.findById(teacherId);
      if (!specifiedTeacher) {
        return res.status(400).json({
          success: false,
          msg: "指定的教師不存在",
        });
      }
      if (!["teacher", "admin"].includes(specifiedTeacher.role)) {
        return res.status(400).json({
          success: false,
          msg: "指定的用戶必須是教師或管理員",
        });
      }

      // 更新教師
      const oldTeacherId = foundCourse.teacher;
      foundCourse.teacher = teacherId;
    }

    // 更新課程信息
    foundCourse.courseName = newCourseName;
    foundCourse.subject = newSubject;
    foundCourse.grade = newGrade;
    foundCourse.courseClass = newCourseClass;
    let savedCourse = await foundCourse.save();

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

/**
 * 刪除課程
 * @route DELETE /deleteCourse
 * @param {string} course_id - 要刪除的課程ID
 * @returns {Object} 刪除操作結果
 */
router.delete("/deleteCourse", async (req, res) => {
  try {
    const { course_id } = req.body;

    // 獲取課程信息
    const foundCourse = await Course.findOne({ _id: course_id }).exec();
    if (!foundCourse)
      return res.status(400).json({ success: false, msg: "沒有找到所屬課程" });
    const courseName = foundCourse.courseName;

    // 檢查權限
    if (
      req.user.role !== "admin" &&
      !req.user.courses.find((n) => n.toString() === course_id.toString())
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有刪除此課程的權限" });
    }

    // 刪除課程（相關資源清理由 Course 模型的 hook 處理）
    await Course.findByIdAndDelete(course_id);

    res.json({ success: true, msg: `課程 ${courseName} 已成功刪除` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, msg: "很抱歉，伺服器刪除課程失敗" });
  }
});

module.exports = router;
