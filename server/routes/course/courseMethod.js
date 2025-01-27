const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const VimeoMethods = require("../../methods").vimeoMethods;

router.get("/members", async (req, res) => {
  try {
    return res.send(req.course.members);
  } catch (e) {
    return res.send(500).send("很抱歉，伺服器目前無法處理您的要求");
  }
});

router.get("/videoInfo", async (req, res) => {
  try {
    let foundVideoInfo = await VideoInfo.find({ courseID: req.course._id });
    return res.send(foundVideoInfo);
  } catch (e) {
    return res.send(500).send("很抱歉，伺服器目前無法處理您的要求");
  }
});

router.post("/uploadVideo", async (req, res) => {
  try {
    const { title, fileSize } = req.body;
    if (!title || !fileSize) return res.status(400).send("上傳資料缺少");

    const uploadUri = await VimeoMethods.upload(req.body, req.course);
    if (!uploadUri.success) throw { uploadUri };
    console.log(uploadUri);
    return res.send(uploadUri);
  } catch (e) {
    console.log(e);
    return res.status(500).send("很抱歉，伺服器無法處理上傳");
  }
});

router.delete("/deleteVideo", async (req, res) => {
  try {
    const { videoId } = req.body;
    let foundVideoInfo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideoInfo) return res.status(400).send("找不到影片資料");
    await VideoInfo.findOneAndDelete({ _id: videoId });
    await VimeoMethods.delete(videoId);
    return res.send("已更新資料庫");
  } catch (e) {
    return res.status(500).send("伺服器處理失敗");
  }
});

module.exports = router;
