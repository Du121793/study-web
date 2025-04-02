const mongoose = require("mongoose");
const { Schema } = mongoose;
const fs = require("fs");
const path = require("path");
const vimeoSchedule = require("../gc/vimeoSchedule-model");

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

function getBaseImagePath() {
  return path.join(__dirname, "../../resource/questionIMG");
}

// 取得對應的資料夾路徑
function getFolder(questionId) {
  return path.join(getBaseImagePath(), questionId.toString());
}

/**
 * 清理函數：
 * - 刪除留言中的所有圖片檔案
 * - 如果留言中包含影片連結，則建立 Vimeo 刪除排程
 * 若其中任何一步失敗，則丟出錯誤，從而中斷後續的刪除動作。
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
        videoIndex: { commentID: doc._id },
      });
      await newSchedule.save();
    } catch (err) {
      throw new Error("建立 Vimeo 刪除排程失敗");
    }
  }
}

// 使用 pre hook，確保在刪除資料前先完成資源清理

// 針對 findOneAndDelete（例如 findByIdAndDelete）
QAmessageSchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete) {
      await cleanupDocument(docToDelete);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 針對文件的 remove() 操作
QAmessageSchema.pre("remove", async function (next) {
  try {
    await cleanupDocument(this);
    next();
  } catch (error) {
    next(error);
  }
});

// 如果使用 deleteOne 作為文件方法（document middleware）
QAmessageSchema.pre("deleteOne", async function (next) {
  try {
    await cleanupDocument(this);
    next();
  } catch (error) {
    next(error);
  }
});

QAmessageSchema.pre("deleteMany", async function (next) {
  try {
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await cleanupDocument(doc);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("QAmessage", QAmessageSchema);
