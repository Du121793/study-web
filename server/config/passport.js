const passport = require("passport");
const LineStrategy = require("passport-line");
const User = require("../models").user;
const dotenv = require("dotenv");
dotenv.config();
let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

passport.serializeUser((user, done) => {
  console.log("Serialize user ...");
  done(null, user.id);
  //  將req.isAuthenticated設定為true
});

passport.deserializeUser(async (_id, done) => {
  console.log("Deserialize user...");
  let foundUser = await User.findOne({ _id });
  done(null, foundUser);
  //   使用done後passport會將user存入req.user方便以後使用
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
      console.log(profile);
      let foundUser = await User.findOne({ lineID: profile.id }).exec();
      if (foundUser) {
        console.log("使用者已存在");
        done(null, foundUser);
      } else {
        console.log("偵測到新用戶");
        let newUser = new User({
          lineID: profile.id,
          userinfo: {
            username: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
        });
        let savedUser = await newUser.save();
        console.log("成功創建新用戶");
        done(null, savedUser);
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
