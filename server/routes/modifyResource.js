const express = require("express");
const router = require("express").Router();
const Board = require("../models").board;
const path = require("path");
const fs = require("fs");

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
        console.error("讀取輪轉圖目錄失敗:", err);
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
          console.error("寫入輪轉圖檔案錯誤:", err);
          return reject(err);
        }
        resolve(newPath);
      });
    });
  });
}

// POST /postNewCarousel：上傳並新增輪轉圖
router.post("/postNewCarousel", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "請上傳一張圖片" });
    }
    const savedPath = await processCarouselImage(req.file);
    // 回傳存檔路徑，可依實際需求轉成 URL 回傳前端
    return res.json({
      success: true,
      msg: "新增輪轉圖成功",
      data: { path: savedPath },
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理新增輪轉圖失敗" });
  }
});

/**
 * DELETE /deleteCarousel
 * 用戶透過 request body 傳入數字陣列，例如 { numbers: [1, 3, 5] }
 * 刪除所有檔名符合 "carousel-{數字}{副檔名}" 的檔案，數字為陣列內的數字
 */
router.delete("/deleteCarousel", async (req, res) => {
  try {
    const { numbers } = req.query;
    if (!Array.isArray(numbers)) {
      return res.status(400).json({ success: false, msg: "請傳入數字陣列" });
    }

    // 轉換陣列內的每個值為 Number，並建立 Set 以便快速查詢
    const numbersSet = new Set(numbers.map((n) => Number(n)));

    // 讀取 carousel 目錄中的所有檔案
    const files = await fs.promises.readdir(carouselPath);
    // 檔案格式為：carousel-{數字}.{副檔名}
    const regex = /^carousel-(\d+)\.[^\.]+$/;
    const deletedFiles = [];

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

    return res.json({
      success: true,
      msg: "輪轉圖刪除完成",
      deletedFiles,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器刪除輪轉圖失敗" });
  }
});

/**
 * POST /postNewBoard
 * 上傳公告，並將上傳的圖片存入 {boardPath}/{newBoard._id}/ 下，命名格式為 image-{數字}{副檔名}
 * poster 自動填入 req.user._id
 */
router.post("/postNewBoard", upload.array("image"), async (req, res) => {
  try {
    // 從 req.body 取得標題、內容等欄位
    const { title, content } = req.body;
    // 建立新 Board，poster 從 req.user 取得
    const newBoard = new Board({
      title,
      content,
      poster: req.user._id,
      // image 初始值為空陣列
      image: [],
    });
    await newBoard.save();

    // 建立以 Board._id 為名稱的資料夾
    const boardFolder = path.join(boardPath, newBoard._id.toString());
    if (!fs.existsSync(boardFolder)) {
      fs.mkdirSync(boardFolder, { recursive: true });
    }

    // 若有上傳圖片，存檔並記錄檔名
    if (req.files && req.files.length > 0) {
      let imageFiles = [];
      // 取得目前資料夾內已有多少張圖片（假設命名格式為 image-{數字})
      const existingFiles = fs.existsSync(boardFolder)
        ? fs.readdirSync(boardFolder)
        : [];
      let maxNumber = 0;
      existingFiles.forEach((fname) => {
        const match = fname.match(/^image-(\d+)\.[^\.]+$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileExt = path.extname(file.originalname);
        const newNumber = maxNumber + i + 1; // 從現有最大數字+1開始
        const newFilename = `image-${newNumber}${fileExt}`;
        const newFilePath = path.join(boardFolder, newFilename);
        fs.writeFileSync(newFilePath, file.buffer);
        // 這裡存入 Board.image 陣列的可以是相對路徑或 URL，依需求調整
        imageFiles.push(newFilename);
      }
      // 更新 Board 文件的 image 欄位
      newBoard.image = imageFiles;
      await newBoard.save();
    }
    return res.json({
      success: true,
      msg: "公告新增成功",
      data: newBoard,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告新增失敗" });
  }
});

/**
 * PATCH /patchBoard
 * 更新公告：
 *  - 可更新 title 與 content
 *  - 用戶可透過 req.body.deleteImages 傳入數字陣列（或 JSON 字串），表示要刪除哪些圖片（依檔名中的數字判斷）
 *  - 同時可上傳新圖片，上傳的新圖片檔名由資料夾內現有圖片的最大數字+1 命名，格式為 image-{數字}{副檔名}
 *  - 若更新後公告圖片為空，則刪除該公告對應的資料夾
 *  - poster 自動填入 req.user._id（通常在新增時已處理，此處僅更新其他欄位）
 */
router.patch("/patchBoard", upload.array("image"), async (req, res) => {
  try {
    const { board_id, title, content, deleteImages } = req.body;
    let board = await Board.findById(board_id);
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }
    // 更新標題與內容
    if (title !== undefined) board.title = title;
    if (content !== undefined) board.content = content;

    // 計算該公告的圖片資料夾路徑
    const boardFolder = path.join(boardPath, board._id.toString());

    // -------------------------------
    // Step 1: 處理刪除圖片
    // -------------------------------
    let imagesToDelete = [];
    if (deleteImages) {
      // 若傳入 deleteImages 為字串，嘗試解析為 JSON 陣列，或以逗號分隔
      if (typeof deleteImages === "string") {
        try {
          imagesToDelete = JSON.parse(deleteImages);
        } catch (err) {
          imagesToDelete = deleteImages.split(",").map(Number);
        }
      } else if (Array.isArray(deleteImages)) {
        imagesToDelete = deleteImages.map(Number);
      }
    }
    if (fs.existsSync(boardFolder) && imagesToDelete.length > 0) {
      // 讀取資料夾內所有檔案
      const files = fs.readdirSync(boardFolder);
      // 檔名格式： image-{數字}.{副檔名}
      const regex = /^image-(\d+)\.[^\.]+$/;
      for (const file of files) {
        const match = file.match(regex);
        if (match) {
          const fileNum = Number(match[1]);
          if (imagesToDelete.includes(fileNum)) {
            const filePath = path.join(boardFolder, file);
            fs.unlinkSync(filePath);
            // 從 board.image 陣列中移除該檔名
            board.image = board.image.filter((f) => f !== file);
          }
        }
      }
    }

    // -------------------------------
    // Step 2: 處理上傳新圖片
    // -------------------------------
    if (req.files && req.files.length > 0) {
      // 若資料夾不存在則建立
      if (!fs.existsSync(boardFolder)) {
        fs.mkdirSync(boardFolder, { recursive: true });
      }
      // 讀取目前資料夾內檔案，找出最大數字
      const currentFiles = fs.readdirSync(boardFolder);
      let maxNumber = 0;
      currentFiles.forEach((fname) => {
        const match = fname.match(/^image-(\d+)\.[^\.]+$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });
      // 上傳的新圖片依序編號
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileExt = path.extname(file.originalname);
        const newNumber = maxNumber + i + 1;
        const newFilename = `image-${newNumber}${fileExt}`;
        const newFilePath = path.join(boardFolder, newFilename);
        fs.writeFileSync(newFilePath, file.buffer);
        board.image.push(newFilename);
      }
    }

    // -------------------------------
    // Step 3: 若更新後 Board.image 為空，則刪除整個資料夾
    // -------------------------------
    if (board.image.length === 0 && fs.existsSync(boardFolder)) {
      fs.rmSync(boardFolder, { recursive: true, force: true });
    }

    await board.save();
    return res.json({ success: true, msg: "公告更新成功", data: board });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告更新失敗" });
  }
});

/**
 * DELETE /deleteBoard
 * 刪除公告：刪除 Board 文件並刪除對應的圖片資料夾
 */
router.delete("/deleteBoard", async (req, res) => {
  try {
    const { board_id } = req.body;
    const board = await Board.findByIdAndDelete(board_id);
    if (!board) {
      return res.status(404).json({ success: false, msg: "找不到該公告" });
    }
    // 刪除對應的圖片資料夾
    const boardFolder = path.join(boardPath, board._id.toString());
    if (fs.existsSync(boardFolder)) {
      fs.rmSync(boardFolder, { recursive: true, force: true });
    }
    return res.json({ success: true, msg: "公告已成功刪除" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "伺服器處理公告刪除失敗" });
  }
});

module.exports = router;
