const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");
const path = require("path");
const vimeoSchedule = require("../gc/vimeoSchedule-model");
const { logError } = require("../../utils/logger");

const QAmessageSchema = new Schema({
  pointTo: { type: mongoose.Schema.Types.ObjectId, ref: "QA", required: true },
  content: {
    type: String,
    maxlength: 3000,
  },
  image: {
    type: [String],
  },
  videoURL: {
    type: [String],
  },
  isUploadSuccess: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  isBest: {
    type: Boolean,
    default: false,
  },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 取得圖片儲存的基底路徑
 * @returns {string} 圖片儲存的基底路徑
 */
function getBaseImagePath() {
  return path.join(__dirname, "../../resource/questionIMG");
}

/**
 * 取得指定問題對應的資料夾路徑
 * @param {string} questionId - 問題ID
 * @returns {string} 問題圖片資料夾的完整路徑
 */
function getFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

/**
 * 清理留言相關資源
 * @description 刪除留言相關的圖片資料夾和影片
 * @param {Object} doc - 要刪除的留言文件
 * @returns {Promise<void>}
 * @throws {Error} 當建立 Vimeo 刪除排程失敗時拋出錯誤
 */
async function cleanupDocument(doc) {
  const commentFolder = getFolder(doc.pointTo + "/comment" + `/${doc._id}`);

  if (fs.existsSync(commentFolder)) {
    fs.rmSync(commentFolder, { recursive: true, force: true });
  }
  // 如果有影片連結，建立 Vimeo 刪除排程
  if (doc.videoURL && Array.isArray(doc.videoURL) && doc.videoURL.length > 0) {
    try {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { commentID: doc._id, questionId: doc.pointTo },
      });
      await newSchedule.save();
    } catch (err) {
      logError({}, "QAmessage-model.js", "建立 Vimeo 刪除排程", {}, err);
      throw new Error("建立 Vimeo 刪除排程失敗");
    }
  }
}

/**
 * 留言刪除前的處理鉤子
 * @description 在留言被刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QAmessageSchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete) {
      await cleanupDocument(docToDelete);
    }
    next();
  } catch (error) {
    logError({}, "QAmessage-model.js", "刪除留言", {}, error);
    next(error);
  }
});

/**
 * 留言移除前的處理鉤子
 * @description 在留言被移除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QAmessageSchema.pre("remove", async function (next) {
  try {
    await cleanupDocument(this);
    next();
  } catch (error) {
    logError({}, "QAmessage-model.js", "移除留言", {}, error);
    next(error);
  }
});

/**
 * 留言單筆刪除前的處理鉤子
 * @description 在留言被單筆刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QAmessageSchema.pre("deleteOne", async function (next) {
  try {
    await cleanupDocument(this);
    next();
  } catch (error) {
    logError({}, "QAmessage-model.js", "刪除留言", {}, error);
    next(error);
  }
});

/**
 * 留言批次刪除前的處理鉤子
 * @description 在留言被批次刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QAmessageSchema.pre("deleteMany", async function (next) {
  try {
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await cleanupDocument(doc);
    }
    next();
  } catch (error) {
    logError({}, "QAmessage-model.js", "批次刪除留言", {}, error);
    next(error);
  }
});

module.exports = mongoose.model("QAmessage", QAmessageSchema);
