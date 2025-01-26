const router = require("express").Router();
const Course = require("../../models").course;
const VideoInfo = require("../../models").courseVideoInfo;

router.get("/", async (req, res) => {
  res.send(req.course);
});

const vimeoMethods = require("../../methods").uploader;
router.post("/uploadVideo", async (req, res) => {
  try {
    const { title, fileSize } = req.body;
    if (!title || !fileSize) return res.status(400).send("上傳資料缺少");

    const uploadUri = await vimeoMethods.upload(req.body, req.course);
    if (!uploadUri.success) throw uploadUri.message;
    console.log(uploadUri);
    return res.send(uploadUri);
  } catch (e) {
    console.log(e);
    return res.status(500).send("很抱歉，伺服器無法處理上傳");
  }
});

router.post("/uploadVideoFailed", async (req, res) => {
  console.log(req.body);
  const { videoId } = req.body;
  await VideoInfo.findByIdAndDelete({ _id: videoId });
  console.log(videoId);
  return res.send("已更新資料庫");
});

module.exports = router;
