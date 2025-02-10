const passport = require("passport");
const LineStrategy = require("passport-line");
const User = require("../models").user;
const dotenv = require("dotenv");
dotenv.config();
let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

passport.serializeUser((user, done) => {
  console.log("Serialize user ...");
  // 如果是已經存在資料庫的使用者 (Mongoose model)，則有 user._id
  if (user && user._id) {
    return done(null, user._id.toString());
  }

  // 如果是尚未綁定的新用戶 (partialUser)，可以直接把需要的資訊打包
  // 注意：這裡用物件或其他方式都可以，但 session 預設只存字串或序列化後的 JSON
  if (user && user.isNew) {
    // 把 lineID, displayName, pictureUrl 等資訊放進去
    return done(null, {
      isNew: user.isNew,
      lineID: user.lineID,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
    });
  }

  // 其他情況再視需求而定
  return done(new Error("無法序列化該使用者物件"), null);
});

passport.deserializeUser(async (serialized, done) => {
  console.log("Deserialize user...");

  // 如果 serialize 時是一個字串 (代表是存 DB 的使用者 _id)，我們就去找 DB
  if (typeof serialized === "string") {
    try {
      const foundUser = await User.findById(serialized);
      return done(null, foundUser);
    } catch (error) {
      return done(error, null);
    }
  }

  // 如果 serialize 時是一個物件 (代表是 partialUser)，直接還原
  if (serialized && serialized.isNew) {
    // 這裡就把當初打包的資料原封不動地還給 req.user
    return done(null, serialized);
  }

  // 其他情況
  return done(new Error("無法反序列化該使用者資料"), null);
});

passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINECHANNELID,
      channelSecret: process.env.LINECHANNELSECRET,
      callbackURL: "http://localhost:8080/auth/successful",
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
        // partialUser（尚未有 _id）:
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

module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        let foundUser = await User.findOne({ _id: jwt_payload.userID });
        if (foundUser) {
          done(null, foundUser); //req.user <= foundUser
        } else {
          return done(null, false);
        }
      } catch (e) {
        return done(e, false);
      }
    })
  );
};
