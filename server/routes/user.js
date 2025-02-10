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
    // 從 query 參數中取得 course_id (前端呼叫時，若提供則為單筆查詢)
    const { course_id } = req.query;

    // 若提供 course_id，則檢查該課程是否存在於使用者的已註冊課程中
    if (course_id) {
      if (!req.user.courses.includes(course_id)) {
        return res.status(404).send("您尚未註冊此課程");
      }
      const foundCourse = await Course.findOne({ _id: course_id });
      if (!foundCourse) {
        return res.status(404).send("找不到該課程");
      }
      return res.send(foundCourse);
    } else {
      // 若未提供 course_id，則回傳使用者所有已註冊課程的資料
      const coursesInfo = await Promise.all(
        req.user.courses.map(async (courseID) => {
          return await Course.findOne({ _id: courseID });
        })
      );
      return res.send(coursesInfo);
    }
  } catch (error) {
    console.error(error);
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

router.post("/preRegisterUser", checkTeacherAccess, async (req, res) => {
  try {
    // 直接將 req.body 當作陣列來處理，每個元素應為 { userinfo, role }
    const users = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ msg: "請提供正確的註冊陣列" });
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
      if (
        !userinfo ||
        !userinfo.realname ||
        !userinfo.phoneNumber ||
        !userinfo.grade
      ) {
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
          role: role || "student",
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

    return res.status(200).json({ msg: responseMessage, successStudentId });
  } catch (error) {
    return res.status(500).json({ msg: "伺服器處理失敗", error });
  }
});

module.exports = router;
