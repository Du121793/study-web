const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");

// 請根據實際情況調整下列模型引入路徑
const VideoInfo = require("../course/videoInfo-model");
const QA = require("../question/QA-model");
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
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 清理課程相關資源
 * @description 當課程被刪除時，清理所有相關資源
 * @param {Object} doc - 要刪除的課程文件
 * @returns {Promise<void>}
 */
async function cleanupCourse(doc) {
  if (!doc) return;
  const courseId = doc._id;

  // 刪除該課程所有影片
  const newSchedule = new vimeoSchedule({
    videoIndex: { courseID: courseId },
    method: "delete",
  });
  await newSchedule.save();
  await VideoInfo.deleteMany({ courseID: courseId });

  // 處理該課程下的 QA 資料
  // 先批次更新，將該課程從所有 QA 的 courses 陣列中移除
  await QA.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
  // 再批次刪除 courses 為空且非公開的 QA
  await QA.deleteMany({ courses: { $size: 0 }, isPublic: false });

  // 更新所有使用者：從 User 文件的 courses 陣列中移除該課程 ID
  await User.updateMany(
    { courses: courseId },
    { $pull: { courses: courseId } }
  );

  // 刪除所有該課程的 VideoAccess
  await VideoAccess.deleteMany({ courseID: courseId });
}

/**
 * 課程刪除前的預處理鉤子
 * @description 在課程被刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
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

/**
 * 課程移除前的預處理鉤子
 * @description 在課程被移除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
courseSchema.pre("remove", async function (next) {
  try {
    await cleanupCourse(this);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 課程單筆刪除前的預處理鉤子
 * @description 在課程被單筆刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
courseSchema.pre("deleteOne", async function (next) {
  try {
    await cleanupCourse(this);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 課程批次刪除前的預處理鉤子
 * @description 在課程被批次刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
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
