/**
 * @file passport.js
 * @description Passport 身份驗證配置，包含 LINE OAuth 和 JWT 驗證策略
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const passport = require("passport");
const LineStrategy = require("passport-line");
const User = require("../models").user;
const dotenv = require("dotenv");
dotenv.config();
let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

/**
 * 序列化使用者資訊
 * @description 將使用者物件轉換為可序列化的格式
 * @param {Object} user - 使用者物件
 * @param {string} user._id - 使用者 ID
 * @param {boolean} user.isNew - 是否為新使用者
 * @param {string} user.lineID - LINE 使用者 ID
 * @param {string} user.displayName - 使用者顯示名稱
 * @param {string} user.pictureUrl - 使用者頭像 URL
 * @param {Function} done - 回調函數
 */
passport.serializeUser((user, done) => {
  console.log("Serialize user ...");
  // 檢查是否為已存在使用者（有 _id）
  if (user && user._id) {
    return done(null, user._id.toString());
  }
  // 檢查是否為新使用者（有 isNew 標記）
  if (user && user.isNew) {
    return done(null, {
      isNew: user.isNew,
      lineID: user.lineID,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
    });
  }
  // 若不符合上述條件，回傳錯誤
  return done(new Error("無法序列化該使用者物件"), null);
});

/**
 * 反序列化使用者資訊
 * @description 將序列化的使用者資訊轉換回使用者物件
 * @param {string|Object} serialized - 序列化的使用者資訊
 * @param {Function} done - 回調函數
 */
passport.deserializeUser(async (serialized, done) => {
  console.log("Deserialize user...");
  // 檢查是否為字串格式（已存在使用者的 ID）
  if (typeof serialized === "string") {
    try {
      // 從資料庫查找使用者
      const foundUser = await User.findById(serialized);
      return done(null, foundUser);
    } catch (error) {
      return done(error, null);
    }
  }
  // 檢查是否為新使用者物件
  if (serialized && serialized.isNew) {
    return done(null, serialized);
  }
  // 若不符合上述條件，回傳錯誤
  return done(new Error("無法反序列化該使用者資料"), null);
});

/**
 * LINE OAuth 驗證策略
 * @description 使用 LINE 帳號進行身份驗證
 * - 檢查使用者是否已存在
 * - 若存在則直接登入
 * - 若不存在則建立部分使用者資訊
 */
passport.use(
  new LineStrategy(
    {
      // 設定 LINE OAuth 配置
      channelID: process.env.LINECHANNELID,
      channelSecret: process.env.LINECHANNELSECRET,
      callbackURL: `${process.env.SERVER_IP}/auth/successful`,
      scope: ["profile", "openid", "email"],
      botPrompt: "normal",
    },
    async (accessToken, refreshToken, profile, done) => {
      // 查找是否已存在使用者
      let foundUser = await User.findOne({ lineID: profile.id }).exec();
      if (foundUser) {
        // 若使用者存在，直接回傳使用者資訊
        console.log("使用者已存在，直接登入");
        return done(null, foundUser);
      } else {
        // 若使用者不存在，建立部分使用者資訊
        console.log("偵測到新用戶，尚未完整綁定");
        const partialUser = {
          lineID: profile.id,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          isNew: true,
        };
        return done(null, partialUser);
      }
    }
  )
);

/**
 * JWT 驗證策略配置
 * @description 從 HTTP header 中以 "jwt" scheme 提取 token 進行驗證
 */
let opts = {};
// 設定 JWT 提取方式為 HTTP header
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
// 設定 JWT 密鑰
opts.secretOrKey = process.env.PASSPORT_SECRET;

/**
 * 預設 JWT 驗證策略
 * @description 驗證 JWT token 並查找對應的使用者
 * @param {Object} jwt_payload - JWT 載入的資料
 * @param {string} jwt_payload.userID - 使用者 ID
 * @param {Function} done - 回調函數
 */
passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      // 根據 JWT 中的 userID 查找使用者
      let foundUser = await User.findOne({ _id: jwt_payload.userID });
      if (foundUser) {
        // 若找到使用者，回傳使用者資訊
        return done(null, foundUser);
      } else {
        // 若未找到使用者，回傳 false
        return done(null, false);
      }
    } catch (e) {
      // 若發生錯誤，回傳錯誤
      return done(e, false);
    }
  })
);

/**
 * JWT Query 驗證策略配置
 * @description 從 URL query 參數中提取 token 進行驗證
 */
let optsQuery = {};
// 設定 JWT 提取方式為 URL query 參數
optsQuery.jwtFromRequest = ExtractJwt.fromUrlQueryParameter("token");
// 設定 JWT 密鑰
optsQuery.secretOrKey = process.env.PASSPORT_SECRET;

/**
 * JWT Query 驗證策略
 * @description 從 URL query 參數中驗證 JWT token 並查找對應的使用者
 * @param {Object} jwt_payload - JWT 載入的資料
 * @param {string} jwt_payload.userID - 使用者 ID
 * @param {Function} done - 回調函數
 */
passport.use(
  "jwt-query",
  new JwtStrategy(optsQuery, async function (jwt_payload, done) {
    try {
      // 根據 JWT 中的 userID 查找使用者
      let foundUser = await User.findOne({ _id: jwt_payload.userID });
      if (foundUser) {
        // 若找到使用者，回傳使用者資訊
        return done(null, foundUser);
      } else {
        // 若未找到使用者，回傳 false
        return done(null, false);
      }
    } catch (e) {
      // 若發生錯誤，回傳錯誤
      return done(e, false);
    }
  })
);

/**
 * 初始化 Passport 配置
 * @description 初始化所有已定義的驗證策略
 * @param {Object} passport - Passport 實例
 */
module.exports = (passport) => {
  // 此處僅需初始化上述所有策略即可
};
