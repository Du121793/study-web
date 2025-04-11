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
  folders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },
  ],
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

// 檢查是否需要刪除問題的鉤子 (update 和 updateMany)
QASchema.pre("update", async function (next) {
  try {
    const update = this.getUpdate();
    if (update.$set) {
      const { isPublic, courses, folders } = update.$set;
      if (isPublic || courses || folders) {
        const docs = await this.model.find(this.getQuery());
        for (const doc of docs) {
          const shouldDeletePublic =
            doc.isPublic === true &&
            (!courses || courses.length === 0) &&
            (!folders || folders.length === 0);

          const shouldDeletePrivate =
            doc.isPublic === false && (!courses || courses.length === 0);

          if (shouldDeletePublic || shouldDeletePrivate) {
            await mongoose.model("QA").findOneAndDelete({ _id: doc._id });
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

QASchema.pre("updateMany", async function (next) {
  try {
    const update = this.getUpdate();
    if (update.$set) {
      const { isPublic, courses, folders } = update.$set;
      if (isPublic || courses || folders) {
        const docs = await this.model.find(this.getQuery());
        for (const doc of docs) {
          const shouldDeletePublic =
            doc.isPublic === true &&
            (!courses || courses.length === 0) &&
            (!folders || folders.length === 0);

          const shouldDeletePrivate =
            doc.isPublic === false && (!courses || courses.length === 0);

          if (shouldDeletePublic || shouldDeletePrivate) {
            await mongoose.model("QA").findOneAndDelete({ _id: doc._id });
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 檢查是否需要刪除問題的鉤子 (save)
QASchema.pre("save", async function (next) {
  try {
    if (this.isPublic === false && this.folders.length !== 0) {
      this.folders = [];
      await this.save();
    }
    if (
      this.isModified("isPublic") ||
      this.isModified("courses") ||
      this.isModified("folders")
    ) {
      if (
        this.isPublic &&
        this.courses.length === 0 &&
        (!this.folders || this.folders.length === 0)
      ) {
        await mongoose.model("QA").findOneAndDelete({ _id: this._id });

        console.log("由於QA已經設定為公開，且沒有任何課程或資料夾，因此被刪除");
        return next();
      }
      if (!this.public && this.courses.length === 0) {
        await mongoose.model("QA").findOneAndDelete({ _id: this._id });

        console.log("由於QA已經設定為非公開，且沒有任何課程，因此被刪除");

        return next();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("QA", QASchema);
