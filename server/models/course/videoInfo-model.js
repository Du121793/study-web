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
 * 共用的清理函數：
 *  - 刪除縮圖檔案 (thumbnail)
 *  - 建立 Vimeo 刪除排程 (若有 videoURL)
 *  - 從 VideoAccess 中移除該影片 _id；若 videoIDs 空了，就刪除那筆 VideoAccess
 */
async function cleanupVideo(doc) {
  if (!doc) return;

  // 1) 刪除縮圖檔案
  if (doc.thumbnail && fs.existsSync(doc.thumbnail)) {
    try {
      fs.unlinkSync(doc.thumbnail);
    } catch (err) {
      console.error("刪除縮圖檔案失敗：", err);
    }
  }

  // 2) 若有 videoURL，建立 Vimeo 刪除排程
  if (doc.videoURL) {
    try {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { videoId: doc._id },
      });
      await newSchedule.save();
    } catch (err) {
      console.error("建立 Vimeo 刪除排程失敗：", err);
    }
  }

  // 3) 從所有 VideoAccess 的 videoIDs 移除該影片 _id
  try {
    // 找出所有包含此影片的 VideoAccess
    const videoAccessList = await VideoAccess.find({ videoIDs: doc._id });
    for (const accessDoc of videoAccessList) {
      // 移除該影片 _id
      accessDoc.videoIDs = accessDoc.videoIDs.filter(
        (vid) => String(vid) !== String(doc._id)
      );
      await accessDoc.save();
    }
  } catch (err) {
    console.error("移除 VideoAccess videoIDs 失敗：", err);
  }
}

/* 
   ================================
   Post Hooks for "single-document" deletes
   ================================
   由於需要「非多筆刪除」時進行這些清理流程，
   我們針對以下幾種“單筆刪除”操作設置 post hook：
   1. findOneAndDelete (例如 findByIdAndDelete)
   2. remove (直接對文件實例呼叫 .remove())
   3. deleteOne (以 document 方式：{ document:true, query:false })

   若是 deleteMany，則代表可能一次刪除多筆，在這裡就跳過或自行另行處理。
*/

/** 1) findOneAndDelete */
videoInfoSchema.post("findOneAndDelete", async function (doc) {
  // doc 即是已被刪除的那筆文件
  // 若為多筆情況 (findManyAndDelete) 不會觸發這個 hook
  if (doc) {
    await cleanupVideo(doc);
  }
});

/** 2) remove (document.remove()) */
videoInfoSchema.post("remove", async function (doc) {
  if (doc) {
    await cleanupVideo(doc);
  }
});

/** 3) deleteOne with document:true, query:false (文件層級) */
videoInfoSchema.post("deleteOne", async function (doc) {
  if (doc) {
    await cleanupVideo(doc);
  }
});

videoInfoSchema.post("deleteMany", async function (result, next) {
  try {
    // 取得符合查詢條件的所有文件
    const docs = await this.model.find(this.getQuery());
    for (const doc of docs) {
      await cleanupVideo(doc);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 如果想確保 deleteMany 不執行這些清理，可以不寫 hook 或在 pre hook 裏顯式攔截
 * videoInfoSchema.pre("deleteMany", function(next){
 *   // 這裡可以選擇要不要處理，或直接 next();
 *   next();
 * });
 */

module.exports = mongoose.model("VideoInfo", videoInfoSchema);
