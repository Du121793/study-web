const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");

// 根據實際狀況調整引入
const vimeoSchedule = require("../gc/vimeoSchedule-model");
const VideoAccess = require("./videoAccess-model");

const videoInfoSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 30,
  },
  courseID: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  type: {
    type: String,
    enum: ["MainClass", "QA", "Other"],
    default: "MainClass",
  },
  description: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  length: {
    type: Number,
  },
  recordDate: {
    type: Date,
    default: Date.now,
  },
  isUploadSuccess: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  videoURL: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// 複合索引（僅示範）
videoInfoSchema.index({ isUploadSuccess: 1, date: 1 });

/**
 * 清理影片相關資源
 * @description 當影片被刪除時，清理所有相關資源
 * @param {Object} doc - 要刪除的影片文件
 * @returns {Promise<void>}
 */
async function cleanupVideo(doc) {
  if (!doc) return;

  // 步驟 1: 刪除縮圖檔案
  if (doc.thumbnail && fs.existsSync(doc.thumbnail)) {
    try {
      fs.unlinkSync(doc.thumbnail);
    } catch (err) {
      console.error("刪除縮圖檔案失敗：", err);
    }
  }

  // 步驟 2: 建立 Vimeo 刪除排程
  if (doc.videoURL) {
    try {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { videoId: doc._id, courseID: doc.courseID },
      });
      await newSchedule.save();
    } catch (err) {
      console.error("建立 Vimeo 刪除排程失敗：", err);
    }
  }

  // 步驟 3: 更新 VideoAccess 記錄
  try {
    const videoAccessList = await VideoAccess.find({ videoIDs: doc._id });
    for (const accessDoc of videoAccessList) {
      accessDoc.videoIDs = accessDoc.videoIDs.filter(
        (vid) => String(vid) !== String(doc._id)
      );
      await accessDoc.save();
    }
  } catch (err) {
    console.error("移除 VideoAccess videoIDs 失敗：", err);
  }
}

/**
 * 影片刪除後的處理鉤子
 * @description 在影片被刪除後執行資源清理
 * @param {Object} doc - 被刪除的影片文件
 */
videoInfoSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await cleanupVideo(doc);
  }
});

/**
 * 影片移除後的處理鉤子
 * @description 在影片被移除後執行資源清理
 * @param {Object} doc - 被移除的影片文件
 */
videoInfoSchema.post("remove", async function (doc) {
  if (doc) {
    await cleanupVideo(doc);
  }
});

/**
 * 影片單筆刪除後的處理鉤子
 * @description 在影片被單筆刪除後執行資源清理
 * @param {Object} doc - 被刪除的影片文件
 */
videoInfoSchema.post("deleteOne", async function (doc) {
  if (doc) {
    await cleanupVideo(doc);
  }
});

/**
 * 影片批次刪除後的處理鉤子
 * @description 在影片被批次刪除後執行資源清理
 * @param {Object} result - 刪除操作結果
 * @param {Function} next - 下一個中間件函數
 */
videoInfoSchema.post("deleteMany", async function (result, next) {
  try {
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await cleanupVideo(doc);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("VideoInfo", videoInfoSchema);
