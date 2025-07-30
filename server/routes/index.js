/**
 * @file index.js
 * @description 路由模組的入口文件，集中導出所有路由模組
 * @author StudyWeb Team
 * @date 2024-03-30
 */

// =====================
// 路由模組導出
// =====================
module.exports = {
  auth: require("./auth"), // 認證相關路由
  user: require("./user"), // 用戶相關路由
  course: require("./course"), // 課程相關路由
  publicResource: require("./publicResource"), // 公開資源路由
  modifyResource: require("./modifyResource"), // 資源修改路由
  system: require("./system"), // 系統管理路由
};
