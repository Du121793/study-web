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

router.post("/preRegisterUser", checkTeacherAccess, async (req, res) => {
  try {
    // userinfo 必須包含 { realname, phoneNumber, grade }
    const { userinfos } = req.body;

    if (!Array.isArray(userinfos) || userinfos.length === 0) {
      return res.status(400).send("請提供註冊資訊陣列");
    }

    let successCount = 0;
    let alreadyRegisteredUsers = [];
    let invalidUsers = [];
    let serverSavedErrorUsers = [];

    for (const userinfo of userinfos) {
      if (!userinfo.realname || !userinfo.phoneNumber || !userinfo.grade) {
        invalidUsers.push(userinfo.realname);
        continue;
      }

      try {
        let foundStudent = await User.findOne({
          "userinfo.realname": userinfo.realname,
          "userinfo.phoneNumber": userinfo.phoneNumber,
        });
        if (foundStudent) {
          alreadyRegisteredUsers.push(userinfo.realname);
          continue;
        }
      } catch (e) {
        serverSavedErrorUsers.push(userinfo.realname);
        continue;
      }

      try {
        let newUser = new User({
          userinfo,
        });
        let savedUser = await newUser.save();
        if (savedUser) {
          successCount++;
        } else {
          serverSavedErrorUsers.push(userinfo.realname);
        }
      } catch (e) {
        serverSavedErrorUsers.push(userinfo.realname);
      }
    }
    let responseMessage = `成功預註冊 ${successCount} 位學生\n`;

    if (alreadyRegisteredUsers.length > 0) {
      responseMessage += `以下學生已經註冊過：${alreadyRegisteredUsers.join(
        ", "
      )}。\n`;
    }

    if (invalidUsers.length > 0) {
      responseMessage += `以下學生資訊提供不完整：${invalidUsers.join(
        ", "
      )}。\n`;
    }

    if (serverSavedErrorUsers.length > 0) {
      responseMessage += `以下學生由於伺服器錯誤註冊失敗：${serverSavedErrorUsers.join(
        ", "
      )}。\n`;
    }

    return res.status(200).json({ msg: responseMessage });
  } catch (error) {
    return res.status(500).json({ msg: "伺服器處裡失敗", error });
  }
});

module.exports = router;
