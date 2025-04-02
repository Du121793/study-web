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

/* -------------------------------
   共用工具函數
---------------------------------*/
// 取得圖片儲存的基底路徑
function getBaseImagePath() {
  return path.join(__dirname, "../../resource/questionIMG");
}

// 取得指定 question 對應的資料夾路徑
function getQuestionFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

/**
 * 共用函數：根據問題 _id 取得對應的圖片資料夾並刪除之（包含所有子檔案與子資料夾）
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

// 透過 pre hook 確保任何 delete 動作前先移除問題圖片資料夾

// 1. query middleware：適用於 findOneAndDelete (例如 findByIdAndDelete)
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

// 2. document middleware：適用於直接對文件執行 remove()
QASchema.pre("remove", async function (next) {
  try {
    await removeQuestionFolder(this);
    next();
  } catch (error) {
    next(error);
  }
});

// 3. document middleware：適用於直接調用 deleteOne()（文件模式）
QASchema.pre("deleteOne", async function (next) {
  try {
    await removeQuestionFolder(this);
    next();
  } catch (error) {
    next(error);
  }
});

QASchema.pre("deleteMany", async function (next) {
  try {
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await removeQuestionFolder(doc);
      // 刪除所有與此 QA 相關的 QAmessage（假設 QAmessage 的 pointTo 為該 QA 的 _id）
      await QAmessage.deleteMany({ pointTo: doc._id });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("QA", QASchema);
