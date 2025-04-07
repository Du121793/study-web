/**
 * @file index.js
 * @description 方法模組的統一導出文件，整合 Vimeo 影片管理和圖片壓縮功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const path = require("path");
const fs = require("fs");

// 讀取配置文件
const CONFIG_PATH = path.join(__dirname, "../config/vimeoConfig.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

// 根據配置選擇 Vimeo 方法版本
function getVimeoMethods() {
  const version = config.version || "VimeoMethods"; // 預設使用 VimeoMethods
  switch (version) {
    case "VimeoMethodsForFree":
      return require("./VimeoMethodsForFree");
    case "VimeoMethodsForFolders":
      return require("./VimeoMethodsForFolders");
    case "VimeoMethods":
    default:
      return require("./VimeoMethodsForFreeV2");
  }
}

module.exports = {
  vimeoMethods: getVimeoMethods(),
  imageCompresser: require("./imageCompresser"),
};
