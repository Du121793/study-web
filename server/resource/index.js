const router = require("express").Router();
const publicRoute = require("./public");
const express = require("express");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
require("../config/passport")(passport);
const accessChecker = require("./resourceMiddleware/accessChecker");
require("dotenv");

const tokenCheckFromQuery = (req, res, next) => {
  passport.authenticate("jwt-query", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// 而是動態地為每一個 questionId 回傳對應的靜態資料夾。
router.use(
  "/questionIMG/:questionId",
  [tokenCheckFromQuery, accessChecker.question], // 先做權限檢查
  (req, res, next) => {
    // 計算出對應的 question 資料夾位置
    const folderPath = path.join(
      __dirname,
      "questionIMG",
      req.params.questionId
    );
    // 此時 req.url 內含例如 "/comment/comment_id" 的子路徑，
    // express.static 會依照此相對路徑去尋找檔案，
    // 因此即使有 comment 資料夾，也能正常讀取。
    express.static(folderPath)(req, res, next);
  }
);

router.use("/questionIMG", (req, res) => {
  return res.status(403).json({
    success: false,
    msg: "不允許直接存取 questionIMG 資料夾",
  });
});

router.use("/public", publicRoute);

module.exports = router;