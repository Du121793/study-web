/**
 * @file index.js
 * @description 資源路由配置，處理靜態資源的存取和權限控制
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const publicRoute = require("./public");
const express = require("express");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
require("../config/passport")(passport);
const accessChecker = require("./resourceMiddleware/accessChecker");
require("dotenv");
const jwt = require("jsonwebtoken");

/**
 * 從 URL query 參數中驗證 JWT token
 * @description 使用 passport-jwt-query 策略驗證 token
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 * @param {Function} next - Express 下一個中間件函數
 */
const tokenCheckFromQuery = (req, res, next) => {
  passport.authenticate("jwt-query", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tokenPayload = jwt.decode(req.headers.authorization.split(" ")[1]);
    if (tokenPayload.ip !== req.ip) {
      return res.status(401).json({
        message: "IP 不匹配，請重新登入",
        code: "IP_MISMATCH",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * 問題圖片存取路由
 * @description 處理問題相關圖片的存取
 * - 需要通過 token 驗證和問題存取權限檢查
 * - 動態映射到對應的問題圖片資料夾
 */
router.use(
  "/questionIMG/:questionId",
  [tokenCheckFromQuery, accessChecker.question], // 先做權限檢查
  (req, res, next) => {
    // 計算目標資料夾路徑
    const folderPath = path.join(
      __dirname,
      "questionIMG",
      req.params.questionId
    );
    // 使用 express.static 處理靜態檔案請求
    express.static(folderPath)(req, res, next);
  }
);

/**
 * 影片圖片存取路由
 * @description 處理課程相關影片圖片的存取
 * - 動態映射到對應的課程影片圖片資料夾
 */
router.use(
  "/videoIMG/:courseId",
  // [tokenCheckFromQuery,accessChecker.course],
  (req, res, next) => {
    // 計算目標資料夾路徑
    const folderPath = path.join(__dirname, "videoIMG", req.params.courseId);
    // 使用 express.static 處理靜態檔案請求
    express.static(folderPath)(req, res, next);
  }
);

/**
 * 問題圖片根目錄存取限制
 * @description 禁止直接存取 questionIMG 根目錄
 */
router.use("/questionIMG", (req, res) => {
  return res.status(403).json({
    success: false,
    msg: "不允許直接存取 questionIMG 資料夾",
  });
});

/**
 * 影片圖片根目錄存取限制
 * @description 禁止直接存取 videoIMG 根目錄
 */
router.use("/videoIMG", (req, res) => {
  return res.status(403).json({
    success: false,
    msg: "不允許直接存取 videoIMG 資料夾",
  });
});

// 掛載公開資源路由
router.use("/public", publicRoute);

module.exports = router;
