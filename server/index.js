const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");

// 載入 Passport 配置（包含 LINE OAuth 與 JWT）
require("./config/passport")(passport);
require("./jobs/cleanUpDataBase");

const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const userRoute = require("./routes").user;
const resourceRoute = require("./resource");
const publicResourceRoute = require("./routes").publicResource;
const modifyResourceRoute = require("./routes").modifyResource;

app.use(
  cors({
    origin: "http://localhost:3000",
    // 這裡需要 session 用於 OAuth，所以保留 credentials: true
    credentials: true,
  })
);

// 初始化 express-session 以支援 OAuth 流程
app.use(
  session({
    secret: process.env.MYSESSIONSECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

mongoose
  .connect("mongodb://localhost:27017/StudyWebDBAlpha")
  .then(() => {
    console.log("Successful to mongodb");
  })
  .catch((e) => {
    console.log(e);
  });

// 使用 JSON 與 URL-encoded 中介軟體
app.use(express.json({ limit: "6MB" }));
app.use(express.urlencoded({ limit: "6MB", extended: true }));

// 啟用 Passport (注意：OAuth 流程需要 session，但 JWT 驗證不需要)
app.use(passport.initialize());
// 若僅用於 OAuth，此時可啟用 session 支持，之後 JWT 驗證可以忽略 session 狀態
app.use(passport.session());

// Token 驗證 middleware (JWT 驗證，無狀態)
const tokenCheck = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    console.log("用戶認證成功 (JWT)");
    next();
  })(req, res, next);
};

// 設定路由
app.use("/auth", authRoute);
app.use("/resource", resourceRoute);
app.use("/publicResource", publicResourceRoute);
app.use("/modifyResource", tokenCheck, modifyResourceRoute);
app.use("/user", tokenCheck, userRoute);
app.use("/course", tokenCheck, courseRoute);

app.listen(8080, () => {
  console.log("server is running on port 8080");
});
