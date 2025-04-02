const router = require("express").Router();
const Board = require("../models").board;
const path = require("path");
const fs = require("fs");

const carouselPath = path.join(__dirname, "../resource/public/carousel");

router.get("/carousel/all", (req, res) => {
  try {
    fs.readdir(carouselPath, (err, files) => {
      if (err) {
        console.error("讀取資料夾失敗:", err);
        return res.status(500).json({ error: "讀取資料夾失敗" });
      }
      // 過濾出常見圖片格式的檔案
      const images = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );
      // 組合成可供前端使用的 URL，例如：/resource/sample.jpg
      const imageUrls = images.map(
        (file) => `${process.env.SERVER_IP}/resource/public/carousel/${file}`
      );
      return res.json({ success: true, data: imageUrls });
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, msg: "伺服器讀取輪轉圖失敗" });
  }
});

router.get("/board", async (req, res) => {
  try {
    const boards = await Board.find({}, "title poster date")
      .populate("poster", "userinfo.username userinfo.pictureUrl")
      .exec();
    return res.json({ success: true, data: boards });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: "伺服器讀取公告失敗" });
  }
});

router.get("/board/:board_id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.board_id)
      .populate("poster", "userinfo.username userinfo.pictureUrl")
      .exec();
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }
    return res.json({ success: true, data: board });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: "伺服器讀取公告失敗" });
  }
});

module.exports = router;
