/**
 * @file auth.js
 * @description 認證相關路由處理，包含 LINE OAuth 登入、用戶註冊和預註冊功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
// const registerValidation = require("../validation").registerValidation;
// const loginValidation = require("../validation").loginValidation;
const passport = require("passport");
require("../config/passport");
// require("./config/passport")(passport);
const User = require("../models").user;
const jwt = require("jsonwebtoken");
const { user } = require("../models");
const tokenConfig = require("../config/tokenConfig.json");

const dotenv = require("dotenv");
dotenv.config();

const accessChecker = require("./routesMiddleware/accessChecker");

const checkTeacherAccess = accessChecker.teacher;

// =====================
// LINE OAuth 路由
// =====================

/**
 * LINE 登入路由
 * 使用 LINE OAuth 進行身份驗證
 */
router.get(
  "/line",
  passport.authenticate("line", {
    scope: ["profile", "openid", "email"],
    prompt: "select_account",
  })
);

/**
 * LINE 登入成功回調路由
 * 處理 LINE OAuth 登入成功後的回調
 */
router.get(
  "/successful",
  passport.authenticate("line", { failureRedirect: "/" }),
  async (req, res) => {
    // 如果是已存在的使用者，req.user 會是從資料庫查到的 User model 實例 (包含 _id)
    if (req.user && req.user._id) {
      // 產生正式 JWT
      const tokenObject = {
        userID: req.user._id,
        ip: req.ip,
      };

      // 如果需要綁定 IP，則加入 IP 資訊
      if (tokenConfig.token.bindIP) {
        tokenObject.ip = req.ip;
      }

      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET, {
        expiresIn: tokenConfig.token.expiration.accessToken,
      });

      // 導回前端的某個頁面，帶上正式 JWT
      return res.redirect(
        301,
        `${process.env.CLIENT_IP}/methods/service/Res?token=${token}`
      );
    }

    // 否則就是「尚未完成綁定」的狀況
    // 將 lineID, displayName, pictureUrl 做成「暫時」的 JWT，帶給前端
    const partialUserPayload = {
      lineID: req.user.lineID,
      displayName: req.user.displayName,
      pictureUrl: req.user.pictureUrl,
    };

    // 如果需要綁定 IP，則加入 IP 資訊
    if (tokenConfig.token.bindIP) {
      partialUserPayload.ip = req.ip;
    }

    const tempToken = jwt.sign(
      partialUserPayload,
      process.env.PASSPORT_SECRET,
      {
        expiresIn: tokenConfig.token.expiration.tempToken,
      }
    );

    // 導向前端的「填寫真實姓名與電話」頁面
    return res.redirect(
      301,
      `${process.env.CLIENT_IP}/methods/service/CompleteInfo?token=${tempToken}`
    );
  }
);

// =====================
// 用戶註冊路由
// =====================

/**
 * 完成用戶註冊
 * 處理新用戶完成 LINE 綁定後的註冊流程
 */
router.post("/completeRegistration", async (req, res) => {
  try {
    const { tempToken, realname, phoneNumber } = req.body;
    if (!tempToken) {
      return res.status(400).json({ success: false, msg: "缺少 tempToken" });
    }
    if (!realname || !phoneNumber) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供完整的真實姓名與電話（必填）" });
    }

    // 解譯暫時的 Token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.PASSPORT_SECRET);

      // 檢查 IP 綁定
      if (tokenConfig.token.bindIP && decoded.ip !== req.ip) {
        return res.status(400).json({ msg: "IP 位址不匹配，請重新登入" });
      }
    } catch (err) {
      return res.status(400).json({ msg: "tempToken 無效或已過期" });
    }

    const { lineID, displayName, pictureUrl } = decoded;

    // STEP1: 檢查是否已有綁定該 lineID 的使用者
    const userWithSameLineID = await User.findOne({ lineID: lineID });
    if (userWithSameLineID) {
      return res.status(400).json({
        success: false,
        msg: "已有使用者綁定此 Line 帳戶，請勿重複註冊。",
      });
    }

    // STEP2: 檢查資料庫是否已有同樣 (realname + phoneNumber) 的使用者
    let existingUser = await User.findOne({
      "userinfo.realname": realname,
      "userinfo.phoneNumber": phoneNumber,
    });

    if (existingUser) {
      // 該使用者若已經有 lineID ，則註冊失敗
      if (existingUser.lineID) {
        return res.status(400).json({
          success: false,
          msg: "此真實姓名與電話已經綁定過 Line 帳戶，註冊失敗。",
        });
      }
      // 否則更新該使用者的 lineID
      existingUser.lineID = lineID;
      existingUser.userinfo.username = displayName;
      existingUser.userinfo.pictureUrl = pictureUrl;

      await existingUser.save();

      // 產生最終 JWT
      const tokenObject = { userID: existingUser._id };

      // 如果需要綁定 IP，則加入 IP 資訊
      if (tokenConfig.token.bindIP) {
        tokenObject.ip = req.ip;
      }

      const finalToken = jwt.sign(tokenObject, process.env.PASSPORT_SECRET, {
        expiresIn: tokenConfig.token.expiration.accessToken,
      });

      return res.status(200).json({
        success: true,
        msg: "成功綁定既有預註冊用戶資料並登入",
        token: finalToken,
      });
    } else {
      /*
      // 沒找到預註冊用戶 → 直接建立新用戶
      const newUser = new User({
        lineID: lineID,
        userinfo: {
          username: displayName,
          realname: realname,
          phoneNumber: phoneNumber,
          pictureUrl: pictureUrl,
        },
      });

      const savedUser = await newUser.save();

      // 產生最終 JWT
      const tokenObject = { userID: savedUser._id };
      const finalToken = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
*/
      return res.status(400).json({
        success: false,
        msg: "你沒有註冊的權限",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "伺服器處理失敗" });
  }
});

// =====================
// 預註冊路由
// =====================

/**
 * 教師預註冊用戶
 * 允許教師批量預註冊學生帳號
 */
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
