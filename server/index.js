// npm i  express jsonwebtoken mongoose dotenv  express-session passport passport-line validation passport-jwt multer

const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("./config/passport")(passport);
require("./jobs/cleanUpDataBase");
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const userRoute = require("./routes").user;
const resourceRoute = require("./resource");
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000", // 或你的前端網域
    credentials: true, // 允許附帶cookie
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

app.use(
  session({
    secret: process.env.MYSESSIONSECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.json({ limit: "6MB" }));
app.use(express.urlencoded({ limit: "6MB", extended: true }));
app.use(passport.initialize());
app.use(passport.session());

const tokenCheck = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // 如果驗證失敗，回覆 401 或你想要的錯誤訊息
      return res.status(401).json({ message: "Unauthorized" });
    }
    // 如果驗證成功，把 user 放到 req.user
    req.user = user;
    // 然後呼叫 next() 進到下一個 middleware (或路由)
    console.log("用戶認證成功");
    next();
  })(req, res, next);
  //   console.log(req.user);
  //   next();
};

app.use("/auth", authRoute);
app.use("/resource", resourceRoute);
app.use("/user", tokenCheck, userRoute);
app.use("/course", tokenCheck, courseRoute);

app.listen(8080, (req, res) => {
  console.log("server is running on port 8080");
});
