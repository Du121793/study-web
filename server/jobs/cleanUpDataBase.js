const cron = require("node-cron");
const VideoInfo = require("../models").courseVideoInfo;
const VimeoMethods = require("../methods").vimeoMethods;

async function processExpiredVideos() {
  const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const cursor = VideoInfo.find({
    isUploadSuccess: false,
    date: { $lte: expiredTime },
  }).cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      await VimeoMethods.delete(doc._id);

      await doc.remove();
      console.log(`已刪除並移除紀錄，_id: ${doc._id}`);
    } catch (err) {
      console.error(`刪除失敗，_id: ${doc._id}`, err);
    }
  }
}

cron.schedule(
  "30 3 * * *",
  async () => {
    console.log("開始執行過期影片清理排程...");
    try {
      await processExpiredVideos();
      console.log("過期影片清理排程執行完畢");
    } catch (err) {
      console.error("過期影片清理排程發生錯誤:", err);
    }
  },
  { timezone: "Asia/Taipei" }
);
