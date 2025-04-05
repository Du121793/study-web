/**
 * @file index.js
 * @description 方法模組的統一導出文件，整合 Vimeo 影片管理和圖片壓縮功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

module.exports = {
  vimeoMethods: require("./VimeoMethods"),
  imageCompresser: require("./imageCompresser"),
};
