const mongoose = require("mongoose");
const { Schema } = mongoose;

const VideoAccessSchema = new Schema({
  accessName: {
    type: String,
    default: "無名稱權限",
  },
  courseID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  videoIDs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "VideoInfo",
    required: true,
  },
  studentIDs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    required: true,
  },
  accessDate: {
    type: Date,
    // 當 accessDate 有值且達到時，文件會依據 TTL 索引被移除。
    // 若此欄位為 null 或未設定，則不會自動銷毀（用來表示永久觀看）
  },
  creater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// 建立 TTL 索引：expireAfterSeconds 設 0 代表當 accessDate 過期時立即過期
VideoAccessSchema.index({ accessDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VideoAccess", VideoAccessSchema);
