/**
 * @file index.js
 * @description 伺服器入口文件，設定 Express 應用程式、資料庫連接和路由配置
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const hpp = require("hpp");
const jwt = require("jsonwebtoken");
const { log, logError } = require("./utils/logger");

// 載入 access 設定（可依需求儲存設定，以下內容來源於 accessConfig.json）
const accessConfig = require("./config/accessConfig.json");

// 取得第二個ip作為req.ip
app.set("trust proxy", 2);

// =====================
// 載入配置和路由
// =====================
require("./config/passport")(passport); // 載入 Passport 配置（包含 LINE OAuth 與 JWT）
require("./jobs/cleanUpDataBase"); // 載入資料庫清理任務

const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const userRoute = require("./routes").user;
const resourceRoute = require("./resource");
const publicResourceRoute = require("./routes").publicResource;
const modifyResourceRoute = require("./routes").modifyResource;

// =====================
// 安全中間件配置
// =====================

// 設置安全相關的 HTTP 標頭
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          process.env.CLIENT_IP,
          "http://localhost:3000",
          process.env.SERVER_IP,
        ],
        "default-src": ["'self'"],
      },
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);

// 限制 API 請求頻率
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 分鐘
  max: 1000, // 限制每個 IP 在 windowMs 時間內最多 1000 個請求
  message: "請求過於頻繁，請稍後再試",
});

// 添加更嚴格的速率限制（3秒內最多30個請求）
const strictLimiter = rateLimit({
  windowMs: 3000, // 3 秒
  max: 20, // 限制每個 IP 在 3 秒內最多 20 個請求
  message: "請求過於頻繁，請稍後再試",
});

app.use("/", limiter);
app.use("/", strictLimiter);

// 清理 XSS 攻擊
app.use(xss());

// 防止 HTTP 參數污染
// 若請求路徑以 "/_next/image" 開頭，則直接跳過 hpp 處理
app.use((req, res, next) => {
  return hpp({
    whitelist: ["w", "q", "url"], // 允許圖片縮放、品質參數與 url 參數
  })(req, res, next);
});

// =====================
// CORS 和 Session 配置
// =====================
app.use(
  cors({
    origin: [process.env.CLIENT_IP, "http://localhost:3000"],
    credentials: true, // 需要 session 用於 OAuth
  })
);

// 初始化 express-session 以支援 OAuth 流程
app.use(
  session({
    secret: process.env.MYSESSIONSECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // 在生產環境中使用 HTTPS
      httpOnly: true, // 防止客戶端 JavaScript 存取 cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    },
  })
);

// =====================
// 資料庫連接
// =====================
mongoose
  .connect(process.env.DB_IP)
  .then(() => {
    log({}, "資料庫連接成功");
  })
  .catch((e) => {
    logError({}, "index.js", "資料庫連接", {}, e);
  });

// 配置請求體解析中間件
app.use(express.json({ limit: "6MB" }));
app.use(express.urlencoded({ limit: "6MB", extended: true }));

// =====================
// Passport 配置
// =====================
app.use(passport.initialize()); // 初始化 Passport
app.use(passport.session()); // 啟用 session 支援（主要用於 OAuth）

/**
 * JWT Token 驗證中間件
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 響應物件
 * @param {Function} next - Express 下一個中間件函數
 */
const tokenCheck = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      logError({}, "index.js", "tokenCheck", { path: req.path }, err);
      return next(err);
    }
    if (!user) {
      logError({}, "index.js", "tokenCheck", {
        path: req.path,
        reason: "未授權",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 檢查 IP 是否匹配（若 accessConfig 設定綁定 IP）
    if (accessConfig.token.bindIP) {
      const tokenPayload = jwt.decode(req.headers.authorization.split(" ")[1]);
      if (tokenPayload.ip !== req.ip) {
        logError(
          {},
          "index.js",
          "tokenCheck",
          {
            path: req.path,
            reason: "IP 不匹配",
            tokenIp: tokenPayload.ip,
            requestIp: req.ip,
          },
          {}
        );
        return res.status(401).json({
          message: "IP 不匹配，請重新登入",
          code: "IP_MISMATCH",
        });
      }
    }

    req.user = user;
    next();
  })(req, res, next);
};

// =====================
// 路由配置
// =====================
app.use("/auth", authRoute);
app.use("/resource", resourceRoute);
app.use("/publicResource", publicResourceRoute);
app.use("/modifyResource", tokenCheck, modifyResourceRoute);
app.use("/user", tokenCheck, userRoute);
app.use("/course", tokenCheck, courseRoute);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logError(
    {
      userIp: req.ip,
      userId: req.user?._id,
      userName: req.user?.userinfo?.name,
    },
    "index.js",
    req.path,
    req.body,
    err
  );
  res.status(500).json({
    success: false,
    message: "伺服器內部錯誤",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  log({}, `伺服器運行在 port ${PORT}`);
});
