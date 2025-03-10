const router = require("express").Router();
const mongoose = require("mongoose");
const Course = require("../models").course;
const User = require("../models/").user;

const accessChecker = require("./routesMiddleware/accessChecker");

const checkTeacherAccess = accessChecker.teacher;
const checkAdminAccess = accessChecker.admin;

router.get("/", (req, res) => {
  try {
    return res.json({ success: true, data: req.user });
  } catch (e) {
    return res.status(500).json({ success: false, msg: "伺服器發生問題" });
  }
});

router.get("/registedCourse", async (req, res) => {
  try {
    // 從 query 參數中取得 course_id 與 filter (filter 為 JSON 格式字串或物件)
    const { course_id, filter } = req.query;
    let projection = {};
    let page, pageSize; // 從 filter 中抽取出來的分頁參數

    // 定義允許過濾的欄位（對應 schema）
    const allowedFields = [
      "courseName",
      "subject",
      "grade",
      "courseClass",
      "members",
      "date",
    ];

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
      // 從 filter 中抽取分頁參數（若存在則取出，page 預設為 1）
      if (parsedFilter.hasOwnProperty("page")) {
        page = parseInt(parsedFilter.page) || 1;
        delete parsedFilter.page;
      }
      if (parsedFilter.hasOwnProperty("pageSize")) {
        pageSize = parseInt(parsedFilter.pageSize);
        delete parsedFilter.pageSize;
      }
      // 根據剩下的 parsedFilter 中的屬性建立投影物件，只允許 schema 定義的欄位
      allowedFields.forEach((field) => {
        if (parsedFilter.hasOwnProperty(field)) {
          projection[field] = 1;
        }
      });
    }

    // 若有指定 course_id，則只查詢該筆資料
    if (course_id) {
      // 非 teacher 身份需檢查該課程是否在使用者的已註冊清單中
      if (
        !req.user.courses.includes(course_id) &&
        req.user.role !== "teacher"
      ) {
        return res
          .status(404)
          .json({ success: false, msg: "您尚未註冊此課程" });
      }
      const foundCourse =
        Object.keys(projection).length > 0
          ? await Course.findOne({ _id: course_id }, projection)
          : await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(404).json({ success: false, msg: "找不到該課程" });
      }
      return res.json({ success: true, data: foundCourse });
    } else {
      // 未指定 course_id，回傳使用者所有已註冊課程的資料
      let courseIds = req.user.courses;
      const totalCourses = courseIds.length;

      // 若有設定 pageSize 則執行分頁（若未提供則全部回傳）
      if (pageSize) {
        const currentPage = page || 1;
        const start = (currentPage - 1) * pageSize;
        courseIds = courseIds.slice(start, start + pageSize);
      }

      const coursesInfo = await Promise.all(
        courseIds.map(async (courseID) => {
          return Object.keys(projection).length > 0
            ? await Course.findOne({ _id: courseID }, projection)
            : await Course.findOne({ _id: courseID });
        })
      );

      if (pageSize) {
        return res.json({
          success: true,
          data: coursesInfo,
          pagination: {
            total: totalCourses,
            page: page || 1,
            pageSize: pageSize,
          },
        });
      } else {
        return res.json({ success: true, data: coursesInfo });
      }
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

/**
 * GET /getMembers
 *
 * 取得會員資料（僅限教師及管理者存取），並支援過濾、排序與分頁。
 *
 * 查詢參數說明：
 * - username: 模糊比對用戶名稱 (userinfo.username)。
 * - realname: 模糊比對真實姓名 (userinfo.realname)。
 * - phoneNumber: 模糊比對手機號碼 (userinfo.phoneNumber)。
 * - _id: 精準比對用戶 ID。
 * - role: 指定用戶角色（"student"、"teacher"、"admin"），預設回傳全部用戶。
 * - courses: 依據課程 ID 過濾用戶。
 *
 * 分頁與排序參數：
 * - page (預設: 1): 當前頁碼。
 * - pageSize (預設: 10): 每頁回傳的筆數。
 * - sortBy (預設: 不做額外排序，即使用 MongoDB 的預設輸出順序)：
 *      可指定 "grade" 或 "date" 進行排序。
 *      - "grade": 依據用戶的年級 (userinfo.grade) 排序。由於教師通常沒有年級，
 *                 因此會將沒有年級的用戶排在最後；同時以創建時間 (date) 作為次排序。
 *      - "date": 依據用戶的創建時間 (date) 排序。
 * - sortOrder (預設: "asc"): 排序方向，"asc" 為升冪、"desc" 為降冪。
 *
 * 範例：
 * GET /getMembers?username=john&page=2&pageSize=5&sortBy=grade&sortOrder=desc&role=student
 */

router.get("/getMembers", checkTeacherAccess, async (req, res) => {
  try {
    // 從 query 中取得各種篩選條件，其中新增 grade
    const { username, realname, phoneNumber, _id, role, courses, grade } = req.query;
    // 新增分頁與排序參數，page 與 pageSize 預設分別為 1 與 10
    const { page = 1, pageSize = 10, sortBy, sortOrder = "asc" } = req.query;
    const parsedPage = parseInt(page);
    const parsedPageSize = parseInt(pageSize);

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
    // 指定腳色，若 role 有傳值，則只回傳該腳色的用戶資料；否則回傳全部
    if (role) {
      filter.role = role;
    }
    if (courses) {
      filter.courses = courses;
    }
    // 新增依據年級的查詢條件 (對 userinfo.grade 進行模糊查詢)
    if (grade) {
      filter["userinfo.grade"] = new RegExp(grade, "i");
    }

    let sortQuery = {};
    // 若 sortBy 未提供，則不做額外排序（MongoDB 的預設輸出順序）
    if (sortBy === "grade") {
      // 依據用戶的年級排序。由於教師沒有年級，預期這類記錄會是 null，
      // 我們藉由設定排序方向使得有數值的年級排在前面，
      // 同時以 date 作次排序。注意：若 sortOrder 為 "asc"，通常 null 值會排在前，
      // 這裡我們用 "asc" 時反向處理年級 (以 -1 排序) 讓 null 值出現在最後；若為 "desc" 則反之。
      if (sortOrder === "asc") {
        sortQuery = { "userinfo.grade": -1, date: 1 };
      } else {
        sortQuery = { "userinfo.grade": 1, date: -1 };
      }
    } else if (sortBy === "date") {
      sortQuery = { date: sortOrder === "asc" ? 1 : -1 };
    }
    // 若未指定 sortBy，則不加入排序條件，維持 MongoDB 的預設輸出順序

    // 先取得符合條件的總筆數，用於計算總頁數
    const totalCount = await User.countDocuments(filter);
    const totalPage = Math.ceil(totalCount / parsedPageSize);

    // 查詢符合條件的用戶，並加入分頁與排序
    const users = await User.find(filter)
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

router.post("/preRegisterUser", checkAdminAccess, async (req, res) => {
  try {
    // 直接將 req.body 當作陣列來處理，每個元素應為 { userinfo, role }
    const users = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供正確的註冊陣列" });
    }

    let successCount = 0;
    let successStudentId = [];
    let alreadyRegisteredUsers = [];
    let invalidUsers = [];
    let serverSavedErrorUsers = [];

    // 處理每筆預註冊的資料
    for (const user of users) {
      const { userinfo, role } = user;

      // 驗證 userinfo 是否存在並具備必要欄位
      if (!userinfo || !userinfo.realname || !userinfo.phoneNumber || !role) {
        invalidUsers.push(userinfo ? userinfo.realname : "未知使用者");
        continue;
      }

      // 檢查是否已有相同 realname 與 phoneNumber 的使用者
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

      // 建立新使用者，若未提供 role 則預設為 "student"
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
    let responseMessage = `成功預註冊 ${successCount} 位使用者\n`;

    if (alreadyRegisteredUsers.length > 0) {
      responseMessage += `以下使用者已經註冊過：${alreadyRegisteredUsers.join(
        ", "
      )}。\n`;
    }

    if (invalidUsers.length > 0) {
      responseMessage += `以下使用者資訊提供不完整：${invalidUsers.join(
        ", "
      )}。\n`;
    }

    if (serverSavedErrorUsers.length > 0) {
      responseMessage += `以下使用者由於伺服器錯誤註冊失敗：${serverSavedErrorUsers.join(
        ", "
      )}。\n`;
    }

    return res
      .status(200)
      .json({ success: true, msg: responseMessage, successStudentId });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "伺服器處理失敗",
      error: "伺服器端發生問題",
    });
  }
});

// 刪除使用者，並從該使用者所註冊的課程中移除該使用者的 _id
// 直接將 req.body 當作陣列來處理，每個元素應為使用者的 _id
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

      // 針對該使用者已註冊的每個課程，從對應課程的 members 陣列中移除該使用者的 _id
      for (const courseId of user.courses) {
        try {
          await Course.findByIdAndUpdate(courseId, {
            $pull: { members: userId },
          });
        } catch (err) {
          // 若更新課程時發生錯誤，將該 userId 記錄為伺服器錯誤，並跳過後續動作
          serverErrorUsers.push(userId);
          continue;
        }
      }

      // 刪除該使用者
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

module.exports = router;
