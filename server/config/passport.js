const passport = require("passport");
const LineStrategy = require("passport-line");
const User = require("../models").user;
const dotenv = require("dotenv");
dotenv.config();
let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

// 序列化與反序列化 (保留不動)
passport.serializeUser((user, done) => {
  console.log("Serialize user ...");
  if (user && user._id) {
    return done(null, user._id.toString());
  }
  if (user && user.isNew) {
    return done(null, {
      isNew: user.isNew,
      lineID: user.lineID,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
    });
  }
  return done(new Error("無法序列化該使用者物件"), null);
});

passport.deserializeUser(async (serialized, done) => {
  console.log("Deserialize user...");
  if (typeof serialized === "string") {
    try {
      const foundUser = await User.findById(serialized);
      return done(null, foundUser);
    } catch (error) {
      return done(error, null);
    }
  }
  if (serialized && serialized.isNew) {
    return done(null, serialized);
  }
  return done(new Error("無法反序列化該使用者資料"), null);
});

// LINE OAuth 策略
passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINECHANNELID,
      channelSecret: process.env.LINECHANNELSECRET,
      callbackURL: `${process.env.SERVER_IP}/auth/successful`,
      scope: ["profile", "openid", "email"],
      botPrompt: "normal",
    },
    async (accessToken, refreshToken, profile, done) => {
      let foundUser = await User.findOne({ lineID: profile.id }).exec();
      if (foundUser) {
        console.log("使用者已存在，直接登入");
        return done(null, foundUser);
      } else {
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

// 預設的 JWT 驗證策略：從 HTTP header 中以 "jwt" scheme 提取 token
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = process.env.PASSPORT_SECRET;

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      let foundUser = await User.findOne({ _id: jwt_payload.userID });
      if (foundUser) {
        return done(null, foundUser);
      } else {
        return done(null, false);
      }
    } catch (e) {
      return done(e, false);
    }
  })
);

// 新增一個 "jwt-query" 策略：從 URL query 參數中提取 token
let optsQuery = {};
optsQuery.jwtFromRequest = ExtractJwt.fromUrlQueryParameter("token");
optsQuery.secretOrKey = process.env.PASSPORT_SECRET;

passport.use(
  "jwt-query",
  new JwtStrategy(optsQuery, async function (jwt_payload, done) {
    try {
      let foundUser = await User.findOne({ _id: jwt_payload.userID });
      if (foundUser) {
        return done(null, foundUser);
      } else {
        return done(null, false);
      }
    } catch (e) {
      return done(e, false);
    }
  })
);

module.exports = (passport) => {
  // 此處僅需初始化上述所有策略即可
};