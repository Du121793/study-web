/**
 * @file user.js
 * @description 用戶相關路由處理，包含用戶資訊查詢、課程註冊和成員管理功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const mongoose = require("mongoose");
const Course = require("../models").course;
const User = require("../models/").user;
const { Parser } = require("json2csv");

const accessChecker = require("./routesMiddleware/accessChecker");

const checkTeacherAccess = accessChecker.teacher;
const checkAdminAccess = accessChecker.admin;

// =====================
// 基本用戶資訊路由
// =====================

/**
 * 獲取當前用戶資訊
 * @route GET /
 * @returns {Object} 當前用戶的完整資訊
 */
router.get("/", (req, res) => {
  try {
    return res.json({ success: true, data: req.user });
  } catch (e) {
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

// =====================
// 課程註冊相關路由
// =====================

/**
 * 獲取用戶已註冊的課程
 * @route GET /registedCourse
 * @param {string} course_id - 可選，指定課程ID
 * @param {string|Object} filter - 可選，過濾條件（JSON格式）
 * @returns {Object} 課程資訊列表或單一課程詳情
 */
router.get("/registedCourse", async (req, res) => {
  try {
    // 解析查詢參數
    const { course_id, filter } = req.query;
    let projection = {};
    let page, pageSize;

    // 定義可過濾的欄位
    const allowedFields = [
      "courseName",
      "subject",
      "grade",
      "courseClass",
      "date",
    ];

    // 處理過濾條件
    if (filter) {
      let parsedFilter = {};
      try {
        parsedFilter = typeof filter === "string" ? JSON.parse(filter) : filter;
      } catch (e) {
        return res.status(400).json({
          success: false,
          msg: "filter 格式錯誤，請傳入合法的 JSON 字串",
        });
      }

      // 處理分頁參數
      if (parsedFilter.hasOwnProperty("page")) {
        page = parseInt(parsedFilter.page) || 1;
        delete parsedFilter.page;
      }
      if (parsedFilter.hasOwnProperty("pageSize")) {
        pageSize = parseInt(parsedFilter.pageSize);
        delete parsedFilter.pageSize;
      }

      // 建立投影物件
      allowedFields.forEach((field) => {
        if (parsedFilter.hasOwnProperty(field)) {
          projection[field] = 1;
        }
      });
    }

    // 處理單一課程查詢
    if (course_id) {
      // 權限檢查
      if (
        !req.user.courses.includes(course_id) &&
        req.user.role !== "teacher"
      ) {
        return res
          .status(404)
          .json({ success: false, msg: "您尚未註冊此課程" });
      }

      // 查詢課程資訊
      const foundCourse =
        Object.keys(projection).length > 0
          ? await Course.findOne({ _id: course_id }, projection)
          : await Course.findOne({ _id: course_id });

      if (!foundCourse) {
        return res.status(404).json({ success: false, msg: "找不到該課程" });
      }

      // 計算成員數量
      const memberCount = await User.countDocuments({ courses: course_id });

      // 轉換為純物件並添加成員數
      const courseData =
        typeof foundCourse.toObject === "function"
          ? foundCourse.toObject()
          : foundCourse;
      courseData.members = memberCount;

      return res.json({ success: true, data: courseData });
    }

    // 處理課程列表查詢
    else {
      let courseIds = req.user.courses;
      const totalCourses = courseIds.length;

      // 處理分頁
      if (pageSize) {
        const currentPage = page || 1;
        const start = (currentPage - 1) * pageSize;
        courseIds = courseIds.slice(start, start + pageSize);
      }

      // 獲取課程詳細資訊
      const coursesInfo = await Promise.all(
        courseIds.map(async (courseID) => {
          const courseInfo =
            Object.keys(projection).length > 0
              ? await Course.findOne({ _id: courseID }, projection)
              : await Course.findOne({ _id: courseID });

          if (courseInfo) {
            const memberCount = await User.countDocuments({
              courses: courseID,
            });
            const courseData =
              typeof courseInfo.toObject === "function"
                ? courseInfo.toObject()
                : courseInfo;
            courseData.members = memberCount;
            return courseData;
          }
          return null;
        })
      );

      // 過濾無效課程
      const filteredCoursesInfo = coursesInfo.filter(
        (course) => course !== null
      );

      // 返回結果
      if (pageSize) {
        return res.json({
          success: true,
          data: filteredCoursesInfo,
          pagination: {
            total: totalCourses,
            page: page || 1,
            pageSize: pageSize,
          },
        });
      }
      return res.json({ success: true, data: filteredCoursesInfo });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

// =====================
// 成員管理路由
// =====================

/**
 * 獲取會員列表
 * @route GET /getMembers
 * @param {string} username - 用戶名稱過濾
 * @param {string} realname - 真實姓名過濾
 * @param {string} phoneNumber - 電話號碼過濾
 * @param {string} _id - 用戶ID過濾
 * @param {string} role - 角色過濾
 * @param {string} courses - 課程過濾
 * @param {string} withoutCourses - 排除特定課程的使用者
 * @param {string} grade - 年級過濾
 * @param {number} page - 頁碼
 * @param {number} pageSize - 每頁筆數
 * @param {string} sortBy - 排序欄位
 * @param {string} sortOrder - 排序方向
 * @returns {Object} 會員列表及分頁資訊
 */
router.get("/getMembers", checkTeacherAccess, async (req, res) => {
  try {
    // 解析查詢參數
    const {
      username,
      realname,
      phoneNumber,
      _id,
      role,
      courses,
      withoutCourses,
      grade,
    } = req.query;
    const { page = 1, pageSize = 10, sortBy, sortOrder = "asc" } = req.query;
    const parsedPage = parseInt(page);
    const parsedPageSize = parseInt(pageSize);

    // 建立過濾條件
    const filter = {};
    if (username) {
      filter["userinfo.username"] = new RegExp(username, "i");
    }
    if (realname) {
      filter["userinfo.realname"] = new RegExp(realname, "i");
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
    if (withoutCourses) {
      filter.courses = { $nin: [withoutCourses] };
    }
    if (grade) {
      filter["userinfo.grade"] = new RegExp(grade, "i");
    }

    // 設定排序條件
    let sortQuery = {};
    if (sortBy === "grade") {
      if (sortOrder === "asc") {
        sortQuery = { "userinfo.grade": -1, date: 1 };
      } else {
        sortQuery = { "userinfo.grade": 1, date: -1 };
      }
    } else if (sortBy === "date") {
      sortQuery = { date: sortOrder === "asc" ? 1 : -1 };
    }

    // 計算總筆數和總頁數
    const totalCount = await User.countDocuments(filter);
    const totalPage = Math.ceil(totalCount / parsedPageSize);

    // 查詢用戶資料
    const users = await User.find(filter, { lineID: 0 })
      .sort(sortQuery)
      .skip((parsedPage - 1) * parsedPageSize)
      .limit(parsedPageSize);

    return res.json({
      success: true,
      data: users,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPage,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

/**
 * 導出會員資料為 CSV 格式
 * @route GET /exportMembers
 * @param {string} selected_members - 可選，指定要導出的會員ID陣列
 * @param {string} username - 可選，用戶名稱過濾
 * @param {string} realname - 可選，真實姓名過濾
 * @param {string} phoneNumber - 可選，電話號碼過濾
 * @param {string} _id - 可選，用戶ID過濾
 * @param {string} role - 可選，角色過濾
 * @param {string} courses - 可選，課程過濾
 * @param {string} grade - 可選，年級過濾
 * @returns {Object} CSV 格式的會員資料
 */
router.get("/exportMembers", checkTeacherAccess, async (req, res) => {
  try {
    console.log(req.query);
    let filter = {};

    // 處理選擇的會員過濾
    if (req.query.selected_members) {
      let selected = req.query.selected_members;
      // 解析選擇的會員ID
      if (typeof selected === "string") {
        try {
          selected = JSON.parse(selected);
        } catch (e) {
          selected = selected.split(",").map((s) => s.trim());
        }
      }
      filter = { _id: { $in: selected } };
    } else {
      // 處理其他過濾條件
      const { username, realname, phoneNumber, _id, role, courses, grade } =
        req.query;
      if (username) {
        filter["userinfo.username"] = new RegExp(username, "i");
      }
      if (realname) {
        filter["userinfo.realname"] = new RegExp(realname, "i");
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
      if (grade) {
        filter["userinfo.grade"] = new RegExp(grade, "i");
      }
    }

    // 查詢用戶資料
    const users = await User.find(filter)
      .populate("courses", "courseName")
      .sort({ date: 1 })
      .lean();

    // 轉換為 CSV 格式
    const dataForCSV = users.map((user) => {
      const courseNames = Array.isArray(user.courses)
        ? user.courses.map((c) => c.courseName).join(",")
        : "";
      const phone =
        user.userinfo && user.userinfo.phoneNumber
          ? `="${user.userinfo.phoneNumber}"`
          : "";
      return {
        lineID: user.lineID || "",
        用戶名稱: user.userinfo?.username || "",
        真實姓名: user.userinfo?.realname || "",
        電話號碼: phone,
        年級: user.userinfo?.grade || "",
        已註冊課程: courseNames,
        身分: user.role || "",
        創建日期: user.date ? user.date.toISOString().slice(0, 10) : "",
      };
    });

    // 設定 CSV 欄位
    const fields = [
      "lineID",
      "用戶名稱",
      "真實姓名",
      "電話號碼",
      "年級",
      "已註冊課程",
      "身分",
      "創建日期",
    ];
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(dataForCSV);
    const csvDataWithBOM = "\ufeff" + csvData;

    // 設定回應標頭並發送 CSV
    res
      .status(200)
      .set("Content-Type", "text/csv; charset=utf-8")
      .set("Content-Disposition", 'attachment; filename="members.csv"')
      .send(Buffer.from(csvDataWithBOM, "utf8"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

/**
 * 預註冊用戶
 * @route POST /preRegisterUser
 * @param {Array} body - 用戶資料陣列，每個元素包含 userinfo 和 role
 * @returns {Object} 註冊結果統計
 */
router.post("/preRegisterUser", checkAdminAccess, async (req, res) => {
  try {
    const users = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供正確的註冊陣列" });
    }

    // 初始化結果追蹤
    let successCount = 0;
    let successStudentId = [];
    let alreadyRegisteredUsers = [];
    let invalidUsers = [];
    let serverSavedErrorUsers = [];

    // 處理每個用戶註冊
    for (const user of users) {
      const { userinfo, role } = user;

      // 驗證必要欄位
      if (!userinfo || !userinfo.realname || !userinfo.phoneNumber || !role) {
        invalidUsers.push(userinfo ? userinfo.realname : "未知使用者");
        continue;
      }

      // 檢查重複註冊
      try {
        let foundUser = await User.findOne({
          "userinfo.realname": userinfo.realname,
          "userinfo.phoneNumber": userinfo.phoneNumber,
        });
        if (foundUser) {
          alreadyRegisteredUsers.push(userinfo.realname);
          continue;
        }
      } catch (err) {
        serverSavedErrorUsers.push(userinfo.realname);
        continue;
      }

      // 創建新用戶
      try {
        let newUser = new User({
          userinfo,
          role,
        });
        let savedUser = await newUser.save();
        if (savedUser) {
          successCount++;
          successStudentId.push(savedUser._id);
        } else {
          serverSavedErrorUsers.push(userinfo.realname);
        }
      } catch (err) {
        serverSavedErrorUsers.push(userinfo.realname);
      }
    }

    // 組合回應訊息
    let globalMsg =
      successCount === users.length
        ? "成功預註冊全部使用者"
        : `成功預註冊 ${successCount} 位使用者`;

    const detailedMsg = {
      preRegisterSuccess: globalMsg,
      alreadyRegistered:
        alreadyRegisteredUsers.length > 0
          ? `以下使用者已經註冊過：${alreadyRegisteredUsers.join(", ")}。`
          : "",
      invalidUsers:
        invalidUsers.length > 0
          ? `以下使用者資訊提供不完整：${invalidUsers.join(", ")}。`
          : "",
      serverError:
        serverSavedErrorUsers.length > 0
          ? `以下使用者由於伺服器錯誤註冊失敗：${serverSavedErrorUsers.join(
              ", "
            )}。`
          : "",
      successStudentId,
    };

    return res.status(200).json({
      success: true,
      msg: globalMsg,
      data: { successMsg: detailedMsg },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "伺服器處理失敗",
      error: "伺服器端發生問題",
    });
  }
});

/**
 * 修改用戶資料
 * @route PATCH /updateProfile
 * @param {string} username - 可選，用戶暱稱
 * @param {string} realname - 可選，真實姓名（僅限教師以上）
 * @param {string} phoneNumber - 可選，電話號碼（僅限教師以上）
 * @param {boolean} makeAnonymous - 可選，是否將圖片設為匿名
 * @returns {Object} 更新結果
 */
router.patch("/updateProfile", async (req, res) => {
  try {
    const { username, realname, phoneNumber, makeAnonymous } = req.body;
    const userRole = req.user.role;

    // 建立更新物件
    const updateData = {};

    // 所有角色都可以更新暱稱
    if (username) {
      updateData["userinfo.username"] = username;
    }

    // 只有教師以上可以更新真實姓名和電話
    if (userRole === "teacher" || userRole === "admin") {
      if (realname) {
        updateData["userinfo.realname"] = realname;
      }
      if (phoneNumber) {
        updateData["userinfo.phoneNumber"] = phoneNumber;
      }
    }

    // 處理匿名化
    if (makeAnonymous === true) {
      updateData["userinfo.makePictureAnonymous"] = true;
    }

    // 如果沒有要更新的資料
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        msg: "沒有提供要更新的資料",
      });
    }

    // 更新用戶資料
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        msg: "找不到該用戶",
      });
    }

    return res.json({
      success: true,
      msg: "成功更新用戶資料",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "更新用戶資料時發生錯誤",
    });
  }
});

/**
 * 批量修改會員資料
 * @route PATCH /patchMembers
 * @param {Array} members - 要修改的會員ID陣列
 * @param {Object} updateData - 要更新的資料
 * @param {string} updateData.username - 可選，用戶暱稱
 * @param {string} updateData.realname - 可選，真實姓名
 * @param {string} updateData.phoneNumber - 可選，電話號碼
 * @param {string} updateData.grade - 可選，年級
 * @param {string} updateData.role - 可選，角色
 * @returns {Object} 更新結果統計
 */
router.patch("/patchMembers", checkAdminAccess, async (req, res) => {
  try {
    const { members, updateData } = req.body;

    // 驗證必要參數
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供要修改的會員ID陣列",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        msg: "請提供要更新的資料",
      });
    }

    // 建立更新物件
    const updateObject = {};
    if (updateData.username) {
      updateObject["userinfo.username"] = updateData.username;
    }
    if (updateData.realname) {
      updateObject["userinfo.realname"] = updateData.realname;
    }
    if (updateData.phoneNumber) {
      updateObject["userinfo.phoneNumber"] = updateData.phoneNumber;
    }
    if (updateData.grade) {
      updateObject["userinfo.grade"] = updateData.grade;
    }
    if (updateData.role) {
      updateObject.role = updateData.role;
    }

    // 初始化結果追蹤
    let successCount = 0;
    let successUserIds = [];
    let notFoundUsers = [];
    let invalidUsers = [];
    let serverErrorUsers = [];

    // 逐一處理每個會員
    for (const memberId of members) {
      try {
        // 檢查 memberId 是否有效
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          invalidUsers.push(memberId);
          continue;
        }

        // 更新會員資料
        const updatedUser = await User.findByIdAndUpdate(
          memberId,
          { $set: updateObject },
          { new: true }
        );

        if (!updatedUser) {
          notFoundUsers.push(memberId);
          continue;
        }

        successCount++;
        successUserIds.push(memberId);
      } catch (error) {
        serverErrorUsers.push(memberId);
        continue;
      }
    }

    // 組合回應訊息
    let responseMessage = `成功更新 ${successCount} 位會員資料。\n`;
    if (notFoundUsers.length > 0) {
      responseMessage += `以下會員不存在：${notFoundUsers.join(", ")}。\n`;
    }
    if (invalidUsers.length > 0) {
      responseMessage += `以下會員ID無效：${invalidUsers.join(", ")}。\n`;
    }
    if (serverErrorUsers.length > 0) {
      responseMessage += `以下會員由於伺服器錯誤更新失敗：${serverErrorUsers.join(
        ", "
      )}。\n`;
    }

    return res.json({
      success: true,
      msg: responseMessage,
      data: {
        successCount,
        successUserIds,
        notFoundUsers,
        invalidUsers,
        serverErrorUsers,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "批量更新會員資料時發生錯誤",
    });
  }
});

/**
 * 刪除使用者，直接將 req.body 當作陣列來處理，每個元素應為使用者的 _id。
 * 刪除時不再需要從該使用者所註冊的課程中移除該使用者的 _id，
 * 因為課程資料結構中已不包含 members 欄位。
 */
router.delete("/deleteMember", checkAdminAccess, async (req, res) => {
  // 取得前端傳入的使用者 _id 陣列
  const users = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res
      .status(400)
      .json({ success: false, msg: "請提供要刪除的使用者 _id 陣列" });
  }

  // 用於分類操作結果
  let successCount = 0;
  let successUserIds = [];
  let notFoundUsers = []; // 找不到使用者的 _id
  let invalidUsers = []; // 無效的使用者 _id（例如格式錯誤）
  let serverErrorUsers = []; // 伺服器錯誤導致無法刪除的使用者

  const mongoose = require("mongoose");

  // 逐一處理每個使用者 _id
  for (const userId of users) {
    // 檢查 userId 是否存在且格式正確
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      invalidUsers.push(userId);
      continue;
    }

    try {
      // 依據 userId 查詢使用者資料
      const user = await User.findById(userId);
      if (!user) {
        notFoundUsers.push(userId);
        continue;
      }

      // 由於課程不再有 members 欄位，
      // 因此不需要從每個課程中移除該使用者的 _id，
      // 只需直接刪除使用者即可

      await User.findByIdAndDelete(userId);
      successCount++;
      successUserIds.push(userId);
    } catch (err) {
      serverErrorUsers.push(userId);
      continue;
    }
  }

  // 組合回應訊息
  let responseMessage = `成功刪除 ${successCount} 位使用者。\n`;
  if (notFoundUsers.length > 0) {
    responseMessage += `以下使用者不存在：${notFoundUsers.join(", ")}。\n`;
  }
  if (invalidUsers.length > 0) {
    responseMessage += `以下使用者 ID 無效：${invalidUsers.join(", ")}。\n`;
  }
  if (serverErrorUsers.length > 0) {
    responseMessage += `以下使用者由於伺服器錯誤刪除失敗：${serverErrorUsers.join(
      ", "
    )}。\n`;
  }

  return res.json({
    success: true,
    msg: responseMessage,
    data: {
      successCount,
      successUserIds,
      notFoundUsers,
      invalidUsers,
      serverErrorUsers,
    },
  });
});

/**
 * 臨時測試用路由 - 更改用戶身分
 * @route POST /changeRole
 * @param {string} role - 要更改的身分 (student/admin/teacher)
 * @returns {Object} 更新結果
 */
router.post("/changeRole", async (req, res) => {
  try {
    const { role } = req.body;

    // 檢查傳入的身分是否有效
    if (!["student", "admin", "teacher"].includes(role)) {
      return res.status(400).json({
        success: false,
        msg: "無效的身分，請傳入 student、admin 或 teacher",
      });
    }

    // 更新用戶身分
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        msg: "找不到該用戶",
      });
    }

    return res.json({
      success: true,
      msg: "成功更新用戶身分",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "更新用戶身分時發生錯誤",
    });
  }
});

module.exports = router;
