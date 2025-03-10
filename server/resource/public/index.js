const router = require("express").Router();
const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv");

const carouselPath = path.join(__dirname, "carousel");
router.use("/carousel", express.static(carouselPath));

router.get("/carousel/all", (req, res) => {
  fs.readdir(carouselPath, (err, files) => {
    if (err) {
      console.error("讀取資料夾失敗:", err);
      return res.status(500).json({ error: "讀取資料夾失敗" });
    }
    // 過濾出常見圖片格式的檔案
    const images = files.filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    // 組合成可供前端使用的 URL，例如：/resource/sample.jpg
    const imageUrls = images.map(
      (file) => `${process.env.SERVER_IP}/resource/public/carousel/${file}`
    );
    res.json({ images: imageUrls });
  });
});

module.exports = router;
