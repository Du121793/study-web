const express = require("express");
const fs = require("fs");
const path = require("path");
const { backup, restore } = require("../utils/backup");
const { log, logError } = require("../utils/logger");
const router = express.Router();
const accessChecker = require("./routesMiddleware/accessChecker");

// 權限檢查中間件（僅 admin 可用）
router.use(accessChecker.admin);
router.use((req, res, next) => {
  // token重新簽發時間<1天，強制重新登入
  if (
    req.user.lastLogin &&
    Date.now() - new Date(req.user.lastLogin).getTime() > 24 * 60 * 60 * 1000
  ) {
    return res
      .status(401)
      .json({ success: false, message: "請重新登入後再操作" });
  }
  next();
});

// 1. 取得備份清單
router.get("/getBackupList", (req, res) => {
  try {
    const backupDir = path.join(__dirname, "../backup");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".zip"));
    res.json({ success: true, files });
  } catch (err) {
    logError(
      { userName: req.user?.userinfo?.name },
      "system.js",
      "getBackupList",
      {},
      err
    );
    res
      .status(500)
      .json({ success: false, message: "取得備份失敗", error: err.message });
  }
});

// 2. 下載備份檔案
router.get("/getBackupFile/:filename", (req, res) => {
  try {
    const backupDir = path.join(__dirname, "../backup");
    const file = path.join(backupDir, req.params.filename);
    if (!fs.existsSync(file))
      return res.status(404).json({ success: false, message: "檔案不存在" });
    res.download(file);
  } catch (err) {
    logError(
      { userName: req.user?.userinfo?.name },
      "system.js",
      "getBackupFile",
      {},
      err
    );
    res
      .status(500)
      .json({ success: false, message: "取得備份失敗", error: err.message });
  }
});

// 3. 立即備份
router.post("/runBackup", async (req, res) => {
  try {
    const backupFile = await backup({ mongoUri: process.env.DB_IP });
    res.json({ success: true, backupFile });
  } catch (err) {
    logError(
      { userName: req.user?.userinfo?.name },
      "system.js",
      "runBackup",
      {},
      err
    );
    res
      .status(500)
      .json({ success: false, message: "備份失敗", error: err.message });
  }
});

// 4. 套用備份
router.post("/enableBackup/:filename", async (req, res) => {
  try {
    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `套用備份檔案 ${req.params.filename}`
    );
    const mode = req.body.mode || "add";
    const backupDir = path.join(__dirname, "../backup");
    const file = path.join(backupDir, req.params.filename);
    if (!fs.existsSync(file))
      return res.status(404).json({ success: false, message: "檔案不存在" });
    await restore({ backupFile: file, mode, mongoUri: process.env.DB_IP });
    res.json({ success: true });
  } catch (err) {
    logError(
      { userName: req.user?.userinfo?.name },
      "system.js",
      "enableBackup",
      { file, mode },
      err
    );
    res
      .status(500)
      .json({ success: false, message: "還原失敗", error: err.message });
  }
});

// 5. 刪除備份檔案
router.delete("/deleteBackupFile/:filename", (req, res) => {
  try {
    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `刪除備份檔案 ${req.params.filename}`
    );
    const backupDir = path.join(__dirname, "../backup");
    const file = path.join(backupDir, req.params.filename);
    if (!fs.existsSync(file))
      return res.status(404).json({ success: false, message: "檔案不存在" });
    fs.unlinkSync(file);
    res.json({ success: true });
  } catch (err) {
    logError(
      { userName: req.user?.userinfo?.name },
      "system.js",
      "deleteBackupFile",
      { file, mode },
      err
    );
    res
      .status(500)
      .json({ success: false, message: "還原失敗", error: err.message });
  }
});

module.exports = router;
