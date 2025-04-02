const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");

// 請根據實際情況調整下列模型引入路徑
const VideoInfo = require("../course/videoInfo-model");
const QA = require("../course/QA-model");
const User = require("../user/user-model");
const VideoAccess = require("./videoAccess-model");
const vimeoSchedule = require("../gc/vimeoSchedule-model");

const courseSchema = new Schema({
  courseName: {
    type: String,
    required: true,
    maxlength: 30,
  },
  subject: {
    type: String,
    maxlength: 30,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  courseClass: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

/**
 * cleanupCourse(doc)
 *
 * 1. 刪除該課程所有影片（批次刪除）
 * 2. 處理該課程下的 QA 資料：
 *    - 批次更新：將該課程從所有 QA 文件的 courses 陣列中移除
 *    - 批次刪除：刪除 courses 為空且非公開的 QA（QA 模型的 query middleware 負責處理相關圖片及留言清理）
 * 3. 更新所有使用者：從 User 文件中移除該課程 ID
 * 4. 刪除所有該課程的 VideoAccess（批次刪除）
 */
async function cleanupCourse(doc) {
  if (!doc) return;
  const courseId = doc._id;

  // (1) 刪除該課程所有影片（使用 bulk 操作）
  const newSchedule = new vimeoSchedule({
    videoIndex: { courseID: courseId },
    method: "delete",
  });
  await newSchedule.save();
  await VideoInfo.deleteMany({ courseID: courseId });

  // (2) 處理該課程下的 QA 資料
  // 先批次更新，將該課程從所有 QA 的 courses 陣列中移除
  await QA.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
  // 再批次刪除 courses 為空且非公開的 QA
  await QA.deleteMany({ courses: { $size: 0 }, isPublic: false });

  // (3) 更新所有使用者：從 User 文件的 courses 陣列中移除該課程 ID
  await User.updateMany(
    { courses: courseId },
    { $pull: { courses: courseId } }
  );

  // (4) 刪除所有該課程的 VideoAccess
  await VideoAccess.deleteMany({ courseID: courseId });

}

/**
 * 下列 pre hook 確保任何單筆刪除操作前，都先執行 cleanupCourse 進行相關資源的清理
 * 注意：這些 hook 僅適用於單筆刪除操作（findOneAndDelete、remove、deleteOne document 方式）
 */
courseSchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());
    await cleanupCourse(docToDelete);
    next();
  } catch (error) {
    next(error);
  }
});

courseSchema.pre("remove", async function (next) {
  try {
    await cleanupCourse(this);
    next();
  } catch (error) {
    next(error);
  }
});

courseSchema.pre("deleteOne", async function (next) {
  try {
    await cleanupCourse(this);
    next();
  } catch (error) {
    next(error);
  }
});

courseSchema.pre("deleteMany", async function (next) {
  try {
    // 取得符合查詢條件的所有文件
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await cleanupCourse(doc);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Course", courseSchema);
