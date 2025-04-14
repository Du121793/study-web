/**
 * @file modifyResource.js
 * @description 資源修改相關路由處理，包含輪轉圖和公告的增刪改查
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const express = require("express");
const router = require("express").Router();
const Board = require("../models").board;
const path = require("path");
const fs = require("fs");
const { log, logError } = require("../utils/logger");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const carouselPath = path.join(__dirname, "../resource/public/carousel");
const boardPath = path.join(__dirname, "../resource/public/board");

const accessChecker = require("./routesMiddleware/accessChecker");
router.use(accessChecker.admin);

/**
 * 處理上傳的輪轉圖檔案
 * 檔案最終存放在 carouselPath 目錄下，檔名格式為 "carousel-{數字}{原始副檔名}"
 * 數字為現有檔案中最大的數字+1（若無符合格式的檔案，則從1開始）
 * @param {Object} file - multer 處理後的檔案
 * @returns {Promise<string>} - 回傳寫入檔案的完整路徑
 */
async function processCarouselImage(file) {
  return new Promise((resolve, reject) => {
    const fileExt = path.extname(file.originalname);
    // 讀取 carousel 目錄內所有檔案
    fs.readdir(carouselPath, (err, files) => {
      if (err) {
        logError({}, "modifyResource.js", "processCarouselImage", {}, err);
        return reject(err);
      }
      let maxNumber = 0;
      files.forEach((filename) => {
        const match = filename.match(/^carousel-(\d+)\.[^\.]+$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      const newNumber = maxNumber + 1;
      const newFilename = `carousel-${newNumber}${fileExt}`;
      const newPath = path.join(carouselPath, newFilename);
      // 寫入檔案
      fs.writeFile(newPath, file.buffer, (err) => {
        if (err) {
          logError({}, "modifyResource.js", "processCarouselImage", {}, err);
          return reject(err);
        }
        resolve(newPath);
      });
    });
  });
}

/**
 * POST /postNewCarousel
 * 上傳並新增輪轉圖
 * @route POST /postNewCarousel
 * @param {Object} req.file - 上傳的圖片檔案
 * @returns {Object} 包含成功狀態、訊息和存檔路徑的 JSON 響應
 */
router.post("/postNewCarousel", upload.single("image"), async (req, res) => {
  try {
    // 檢查是否有上傳檔案
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "請上傳一張圖片" });
    }

    // 處理並儲存輪轉圖
    const savedPath = await processCarouselImage(req.file);

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `新增輪轉圖 ${path.basename(savedPath)}`
    );

    // 回傳存檔路徑，可依實際需求轉成 URL 回傳前端
    return res.json({
      success: true,
      msg: "新增輪轉圖成功",
      data: { path: savedPath },
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "modifyResource.js",
      "POST /postNewCarousel",
      {},
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理新增輪轉圖失敗" });
  }
});

/**
 * DELETE /deleteCarousel
 * 刪除指定的輪轉圖
 * @route DELETE /deleteCarousel
 * @param {Array} req.query.numbers - 要刪除的輪轉圖編號陣列
 * @returns {Object} 包含成功狀態、訊息和已刪除檔案列表的 JSON 響應
 */
router.delete("/deleteCarousel", async (req, res) => {
  try {
    // 從查詢參數中獲取要刪除的輪轉圖編號陣列
    const { numbers } = req.query;

    // 轉換陣列內的每個值為 Number，並建立 Set 以便快速查詢
    const numbersSet = new Set([Number(numbers)]);

    // 讀取 carousel 目錄中的所有檔案
    const files = await fs.promises.readdir(carouselPath);

    // 檔案格式為：carousel-{數字}.{副檔名}
    const regex = /^carousel-(\d+)\.[^\.]+$/;
    const deletedFiles = [];

    // 遍歷所有檔案，找出符合條件的檔案並刪除
    for (const file of files) {
      const match = file.match(regex);
      if (match) {
        const fileNumber = Number(match[1]);
        if (numbersSet.has(fileNumber)) {
          const filePath = path.join(carouselPath, file);
          await fs.promises.unlink(filePath);
          deletedFiles.push(file);
        }
      }
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `刪除輪轉圖 ${numbers.join(", ")}`
    );

    // 回傳刪除結果
    return res.json({
      success: true,
      msg: "輪轉圖刪除完成",
      deletedFiles,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "modifyResource.js",
      "DELETE /deleteCarousel",
      req.query,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器刪除輪轉圖失敗" });
  }
});

/**
 * POST /postNewBoard
 * 上傳公告，並將上傳的圖片存入 {boardPath}/{newBoard._id}/ 下，命名格式為 image-{數字}{副檔名}
 * @route POST /postNewBoard
 * @param {string} req.body.title - 公告標題
 * @param {string} req.body.subTitle - 公告副標題
 * @param {string} req.body.content - 公告內容，可包含 base64 格式的圖片
 * @returns {Object} 包含成功狀態、訊息和新增的公告資料的 JSON 響應
 */
router.post("/postNewBoard", async (req, res) => {
  try {
    const { title, subTitle, content } = req.body;

    const newBoard = new Board({
      title,
      subTitle,
      content,
      poster: req.user._id,
    });
    await newBoard.save();

    // 建立以 Board._id 為名稱的資料夾
    const boardFolder = path.join(boardPath, newBoard._id.toString());
    if (!fs.existsSync(boardFolder)) {
      fs.mkdirSync(boardFolder, { recursive: true });
    }

    // 尋找內容中的 base64 圖片
    const imageRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"/g;
    let match;
    let newContent = content;
    let imageCount = 0;

    // 處理內容中的每張 base64 圖片
    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, imageType, base64Data] = match;

      // 將 base64 轉換為 buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // 建立新的檔名
      const newNumber = imageCount + 1;
      const newFilename = `image-${newNumber}.${imageType}`;
      const newFilePath = path.join(boardFolder, newFilename);

      // 寫入檔案
      fs.writeFileSync(newFilePath, imageBuffer);

      // 更新 content 中的圖片路徑
      const relativePath = `/resource/public/board/${newBoard._id}/${newFilename}`;
      newContent = newContent.replace(fullMatch, `<img src="${relativePath}"`);

      imageCount++;
    }

    // 更新 Board 文件的 content
    if (imageCount > 0) {
      newBoard.content = newContent;
      await newBoard.save();
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `新增公告 ${title}`
    );

    return res.json({
      success: true,
      msg: "公告新增成功",
      data: newBoard,
    });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "modifyResource.js",
      "POST /postNewBoard",
      { title, subTitle },
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告新增失敗" });
  }
});

/**
 * PUT /putBoard
 * 更新公告內容，包括標題、副標題和內容
 * @route PUT /putBoard
 * @param {string} req.body.board_id - 要更新的公告 ID
 * @param {string} [req.body.title] - 新的公告標題
 * @param {string} [req.body.subTitle] - 新的公告副標題
 * @param {string} [req.body.content] - 新的公告內容，可包含 base64 格式的圖片
 * @returns {Object} 包含成功狀態、訊息和更新後的公告資料的 JSON 響應
 */
router.put("/putBoard", async (req, res) => {
  try {
    // 從請求體中獲取公告ID和更新內容
    const { board_id, title, subTitle, content } = req.body;

    // 查找要更新的公告
    let board = await Board.findById(board_id);
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }

    // 更新基本資料
    if (title !== undefined) board.title = title;
    if (subTitle !== undefined) board.subTitle = subTitle;
    if (content !== undefined) board.content = content;

    // 計算該公告的圖片資料夾路徑
    const boardFolder = path.join(boardPath, board._id.toString());

    // 清空原有圖片資料夾
    if (fs.existsSync(boardFolder)) {
      fs.rmSync(boardFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(boardFolder, { recursive: true });

    // 處理新的 base64 圖片
    const imageRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"/g;
    let match;
    let newContent = content;
    let imageCount = 0;

    // 處理內容中的每張 base64 圖片
    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, imageType, base64Data] = match;

      // 將 base64 轉換為 buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // 建立新的檔名
      const newNumber = imageCount + 1;
      const newFilename = `image-${newNumber}.${imageType}`;
      const newFilePath = path.join(boardFolder, newFilename);

      // 寫入檔案
      fs.writeFileSync(newFilePath, imageBuffer);

      // 更新 content 中的圖片路徑
      const relativePath = `/resource/public/board/${board._id}/${newFilename}`;
      newContent = newContent.replace(fullMatch, `<img src="${relativePath}"`);

      imageCount++;
    }

    // 更新 Board 文件的 content
    if (imageCount > 0) {
      board.content = newContent;
    }

    // 儲存更新後的公告
    await board.save();

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `更新公告 ${board_id}`
    );

    // 回傳更新結果
    return res.json({ success: true, msg: "公告更新成功", data: board });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "modifyResource.js",
      "PUT /putBoard",
      req.body,
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告更新失敗" });
  }
});

/**
 * DELETE /deleteBoard/:board_id
 * 刪除指定的公告及其相關圖片
 * @route DELETE /deleteBoard/:board_id
 * @param {string} req.params.board_id - 要刪除的公告 ID
 * @returns {Object} 包含成功狀態和訊息的 JSON 響應
 */
router.delete("/deleteBoard/:board_id", async (req, res) => {
  try {
    // 從路徑參數中獲取公告ID
    const { board_id } = req.params;

    // 查找並刪除公告
    const board = await Board.findByIdAndDelete(board_id);
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }

    // 刪除對應的圖片資料夾
    const boardFolder = path.join(boardPath, board._id.toString());
    if (fs.existsSync(boardFolder)) {
      fs.rmSync(boardFolder, { recursive: true, force: true });
    }

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `刪除公告 ${board_id}`
    );

    // 回傳刪除結果
    return res.json({ success: true, msg: "公告已成功刪除" });
  } catch (e) {
    logError(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      "modifyResource.js",
      "DELETE /deleteBoard/:board_id",
      { board_id: req.params.board_id },
      e
    );
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告刪除失敗" });
  }
});

module.exports = router;
