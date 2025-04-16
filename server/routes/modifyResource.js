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
      `刪除輪轉圖 ${numbers}`
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
 * @param {string} req.body.board_id - 要更新的公告 ID（必填）
 * @param {string} req.body.title - 新的公告標題（必填）
 * @param {string} req.body.subTitle - 新的公告副標題（必填）
 * @param {string} req.body.content - 新的公告內容，可包含 base64 圖片（必填）
 * @returns {Object} 包含成功狀態、訊息和更新後的公告資料的 JSON 響應
 */
router.put("/putBoard", async (req, res) => {
  try {
    const { board_id, title, subTitle, content } = req.body;

    // 1. 必填欄位檢查
    if (!board_id || !title || !subTitle || !content) {
      return res
        .status(400)
        .json({ success: false, msg: "缺少必要欄位，無法更新公告" });
    }

    // 2. 查詢公告
    let board = await Board.findById(board_id);
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }

    // 3. 更新基本文字資料
    board.title = title;
    board.subTitle = subTitle;
    // 先把 content 留著，待會處理完圖片後，最後再賦值回去
    let originalContent = content;

    // 4. 準備公告的圖片資料夾
    const boardFolder = path.join(boardPath, board._id.toString());
    if (!fs.existsSync(boardFolder)) {
      fs.mkdirSync(boardFolder, { recursive: true });
    }

    // 讀出「舊」圖片清單
    const oldFiles = fs.readdirSync(boardFolder);
    const oldImages = new Set(oldFiles);

    // 找出已存在的最大 image 編號，避免覆蓋舊圖
    let maxImageIndex = 0;
    for (const file of oldFiles) {
      const match = file.match(/^image-(\d+)\.(.+)$/); 
      if (match) {
        const idx = parseInt(match[1], 10);
        if (!isNaN(idx) && idx > maxImageIndex) {
          maxImageIndex = idx;
        }
      }
    }
    let nextImageIndex = maxImageIndex + 1;

    // 5. 以正規表達式找出所有 <img ...> 標籤
    const imageTagRegex = /<img[^>]*>/gi;
    let newContentSegments = [];
    let lastIndex = 0;
    let keepImages = new Set(); // 需要保留的舊檔名或新檔名

    let imgMatch;
    while ((imgMatch = imageTagRegex.exec(originalContent)) !== null) {
      const entireTag = imgMatch[0];
      const startIndex = imgMatch.index;
      const endIndex = imageTagRegex.lastIndex;

      // 先把前一段（非 <img> 的部分）加入
      newContentSegments.push(originalContent.substring(lastIndex, startIndex));

      // 再進一步找 <img> 裡的 src
      const srcAttrRegex = /\bsrc\s*=\s*(["'])(.*?)\1/i;
      const srcMatch = entireTag.match(srcAttrRegex);

      if (!srcMatch) {
        // 如果 <img> 沒 src，乾脆移除
        lastIndex = endIndex;
        continue;
      }

      let srcValue = srcMatch[2]; // 原始的 src
      let newImgTag = entireTag;  // 預設保留整個 <img>，若有需求再改

      // -- 檢查是否 base64 --
      const base64Regex = /^data:image\/([^;]+);base64,(.+)$/;
      const base64Match = srcValue.match(base64Regex);

      if (base64Match) {
        // base64 圖片 => 轉檔並另存新名稱
        const imageType = base64Match[1];  
        const base64Data = base64Match[2];  
        const imageBuffer = Buffer.from(base64Data, "base64");

        const newFilename = `image-${nextImageIndex}.${imageType}`;
        nextImageIndex++;

        const newFilePath = path.join(boardFolder, newFilename);
        fs.writeFileSync(newFilePath, imageBuffer);

        // 更新 <img> 的 src
        const newSrc = `/resource/public/board/${board._id}/${newFilename}`;
        newImgTag = newImgTag.replace(srcAttrRegex, `src="${newSrc}"`);

        keepImages.add(newFilename);

      } else {
        // 非 base64 => 檢查是否屬於當前公告的本地圖片
        // 有些環境可能會傳來 domain 或 /api，需去除前綴，只比對後半部
        // 先嘗試找出 "/resource/public/board/<board_id>/" 之後的子字串
        // 例如 "https://xxx.com/api/resource/public/board/6418e8a76c529f4/image-1.png"
        // 最後我們只關心 "/resource/public/board/6418e8a76c529f4/image-1.png" 之後的部分

        const pathIndex = srcValue.indexOf(`/resource/public/board/${board._id}/`);
        if (pathIndex !== -1) {
          // 取得真正的檔名（含子資料夾路徑或檔名）
          const realPath = srcValue.substring(pathIndex); 
          // realPath 形如：/resource/public/board/<board_id>/image-1.png

          // 取出最後的檔名
          // "/resource/public/board/6418e8a76c529f4/image-1.png" => "image-1.png"
          const fileName = realPath.replace(`/resource/public/board/${board._id}/`, "");

          // 檢查此檔名在舊檔案中是否存在
          if (oldImages.has(fileName)) {
            // 存在 => 保留
            keepImages.add(fileName);

            // 也確保 <img> src 統一成沒有多餘 domain /api 的版本
            const pureSrc = `/resource/public/board/${board._id}/${fileName}`;
            newImgTag = newImgTag.replace(srcAttrRegex, `src="${pureSrc}"`);
          } else {
            // 舊檔中找不到 => 移除此 <img>
            newImgTag = "";
          }
        } else {
          // 不在同一路徑 => 移除
          newImgTag = "";
        }
      }

      // 放入新的 <img>（或空字串）
      newContentSegments.push(newImgTag);
      lastIndex = endIndex;
    }

    // 處理最後一段（最後一個 <img> 之後）
    newContentSegments.push(originalContent.substring(lastIndex));
    const newContent = newContentSegments.join("");

    // 6. 刪除未被引用的舊圖片
    for (const oldFile of oldImages) {
      if (!keepImages.has(oldFile)) {
        try {
          fs.unlinkSync(path.join(boardFolder, oldFile));
        } catch (err) {
          // 可自行記錄錯誤
          console.error("刪除舊檔案時發生錯誤：", err);
        }
      }
    }

    // 7. 更新 content 並儲存
    board.content = newContent;
    await board.save();

    log(
      {
        userIp: req.ip,
        userId: req.user._id,
        userName: req.user.userinfo.realname,
      },
      `更新公告 ${board_id}`
    );

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
