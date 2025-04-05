const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");
const path = require("path");
const QAmessage = require("./QAmessage-model");

const QASchema = new Schema({
  image: {
    type: [String],
  },
  description: {
    required: true,
    type: String,
    maxlength: 300,
  },
  resourceCategories: {
    required: true,
    type: [String],
  },
  hints: {
    required: true,
    type: [String],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  courses: {
    type: [String],
    default: [],
  },
  messages: {
    type: [String],
    default: [],
  },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
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
function getQuestionFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

/**
 * 清理問題相關資源
 * @description 刪除問題相關的圖片資料夾和訊息
 * @param {Object} doc - 要刪除的問題文件
 * @returns {Promise<void>}
 */
async function removeQuestionFolder(doc) {
  if (doc) {
    QAmessage.deleteMany({ pointTo: doc._id });
    const questionFolder = getQuestionFolder(doc._id);
    if (fs.existsSync(questionFolder)) {
      fs.rmSync(questionFolder, { recursive: true, force: true });
    }
  }
}

/**
 * 問題刪除前的處理鉤子
 * @description 在問題被刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QASchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete) {
      await removeQuestionFolder(docToDelete);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 問題移除前的處理鉤子
 * @description 在問題被移除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QASchema.pre("remove", async function (next) {
  try {
    await removeQuestionFolder(this);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 問題單筆刪除前的處理鉤子
 * @description 在問題被單筆刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QASchema.pre("deleteOne", async function (next) {
  try {
    await removeQuestionFolder(this);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 問題批次刪除前的處理鉤子
 * @description 在問題被批次刪除前執行資源清理
 * @param {Function} next - 下一個中間件函數
 */
QASchema.pre("deleteMany", async function (next) {
  try {
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await removeQuestionFolder(doc);
      await QAmessage.deleteMany({ pointTo: doc._id });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("QA", QASchema);
