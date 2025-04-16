/**
 * @file publicResource.js
 * @description 公開資源相關路由處理，包含輪轉圖和公告的讀取
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const Board = require("../models").board;
const path = require("path");
const fs = require("fs");
const { log, logError } = require("../utils/logger");

// 定義輪轉圖存放路徑
const carouselPath = path.join(__dirname, "../resource/public/carousel");

/**
 * GET /carousel/all
 * 獲取所有輪轉圖的URL列表
 * @route GET /carousel/all
 * @returns {Object} 包含成功狀態和輪轉圖URL列表的 JSON 響應
 */
router.get("/carousel/all", (req, res) => {
  try {
    // 讀取輪轉圖目錄下的所有檔案
    fs.readdir(carouselPath, (err, files) => {
      if (err) {
        logError(
          {
            userIp: req.ip,
          },
          "publicResource.js",
          "GET /carousel/all",
          {},
          err
        );
        return res.status(500).json({ error: "讀取資料夾失敗" });
      }

      // 過濾出常見圖片格式的檔案（jpg、jpeg、png、gif）
      const images = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );

      // 組合成完整的URL路徑，加入伺服器IP
      // 例如：http://server-ip/resource/public/carousel/image.jpg
      const imageUrls = images.map(
        (file) => `${process.env.SERVER_IP}/resource/public/carousel/${file}`
      );

      // 回傳成功狀態和圖片URL列表
      return res.json({ success: true, data: imageUrls });
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
      },
      "publicResource.js",
      "GET /carousel/all",
      {},
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器讀取輪轉圖失敗" });
  }
});

/**
 * GET /board
 * 取得所有公告的基本資訊(不含content)，依日期排序並分頁
 * @route GET /board
 * @param {number} [req.query.page=1] - 頁碼
 * @param {number} [req.query.pageSize=10] - 每頁顯示的公告數量
 * @returns {Object} 包含成功狀態、公告列表、分頁資訊的 JSON 響應
 */
router.get("/board", async (req, res) => {
  try {
    // 解析分頁參數，若未提供則使用預設值
    // page: 當前頁碼，預設為1
    // pageSize: 每頁顯示數量，預設為10
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // 計算公告總數，用於計算總頁數
    const total = await Board.countDocuments();

    // 查詢公告列表
    // 1. 排除content欄位以減少傳輸量
    // 2. 依日期降序排序（新的在前）
    // 3. 根據分頁參數進行分頁
    // 4. 關聯查詢發布者資訊
    const boards = await Board.find({}, { content: 0 })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("poster", "userinfo.username userinfo.pictureUrl role userinfo.makePictureAnonymous")
      .exec();

    // 轉換發布者資料格式，提取需要的資訊
    // 包括：用戶名、頭像URL和角色
    const boardsData = boards.map((board) => {
      const boardObj = board.toObject();
      if (boardObj.poster) {
        boardObj.poster = {
          username: boardObj.poster.userinfo?.username || "",
          displayPictureUrl: boardObj.poster.userinfo?.displayPictureUrl || "",
          role: boardObj.poster.role,
        };
      }
      return boardObj;
    });

    // 回傳成功狀態、公告列表和分頁資訊
    return res.json({
      success: true,
      msg: "取得公告列表成功",
      data: {
        boards: boardsData, // 公告列表
        total, // 公告總數
        page, // 當前頁碼
        pageSize, // 每頁數量
        totalPages: Math.ceil(total / pageSize), // 總頁數
      },
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
      },
      "publicResource.js",
      "GET /board",
      req.query,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告列表獲取失敗" });
  }
});

/**
 * GET /board/:board_id
 * 取得單一公告完整資訊，包含content
 * @route GET /board/:board_id
 * @param {string} req.params.board_id - 公告ID
 * @returns {Object} 包含成功狀態和公告完整資訊的 JSON 響應
 */
router.get("/board/:board_id", async (req, res) => {
  try {
    // 查詢指定ID的公告
    // 同時關聯查詢發布者的資訊（用戶名、頭像和角色）
    const board = await Board.findById(req.params.board_id)
      .populate("poster", "userinfo.username userinfo.pictureUrl role userinfo.makePictureAnonymous")
      .exec();

    // 如果找不到公告，回傳404錯誤
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }

    // 將 Mongoose 文件轉換為普通對象
    const boardData = board.toObject();

    // 轉換發布者資料格式，提取需要的資訊
    // 包括：用戶名、頭像URL和角色
    if (boardData.poster) {
      boardData.poster = {
        username: boardData.poster.userinfo?.username || "",
        displayPictureUrl: boardData.poster.userinfo?.displayPictureUrl || "",
        role: boardData.poster.role,
      };
    }

    // 處理公告內容中的圖片路徑
    // 將相對路徑轉換為完整的URL路徑（加入伺服器IP）
    const imageRegex = /<img[^>]+src="(\/resource\/public\/board\/[^"]+)"/g;
    boardData.content = boardData.content.replace(imageRegex, (match, path) => {
      return match.replace(path, `${process.env.SERVER_IP}${path}`);
    });

    // 回傳成功狀態和公告完整資訊
    return res.json({ success: true, data: boardData });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
      },
      "publicResource.js",
      "GET /board/:board_id",
      { board_id: req.params.board_id },
      e
    );
    return res.status(500).json({ success: false, msg: "伺服器讀取公告失敗" });
  }
});

module.exports = router;
