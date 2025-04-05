/**
 * @file index.js
 * @description 模型統一導出文件，整合所有資料庫模型
 * @author StudyWeb Team
 * @date 2024-03-30
 */
module.exports = {
  user: require("./user/user-model"),
  course: require("./course/course-model"),
  courseVideoInfo: require("./course/videoInfo-model"),
  courseVideoAccess: require("./course/videoAccess-model"),
  QA: require("./question/QA-model"),
  QAmessage: require("./question/QAmessage-model"),
  vimeoSchedule: require("./gc/vimeoSchedule-model"),
  board: require("./homepage/board-model"),
};
