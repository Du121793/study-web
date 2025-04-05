/**
 * @file imageCompresser.js
 * @description 圖片壓縮工具，提供 base64 和 Buffer 格式圖片的壓縮功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const sharp = require("sharp");

/**
 * 壓縮並轉換 base64 圖片，使最終檔案大小不超過指定大小，
 * 解析度至少為 1280×720，並轉為 JPEG 編碼。
 * 當原圖超過指定大小時，會依超過程度降低壓縮品質；指定大小以下則僅輕微壓縮。
 *
 * @param {string} base64Input - 包含前綴的 base64 圖片 (例如: data:image/png;base64,...)
 * @param {number} [MAX_MB=1] - 最大檔案大小限制（MB）
 * @returns {Promise<string>} 壓縮後並加上 JPEG 前綴的 base64 圖片
 * @throws {Error} 當圖片處理失敗時拋出錯誤
 */
async function compressBase64Image(base64Input, MAX_MB = 1) {
  // 設定壓縮參數
  const MAX_SIZE = MAX_MB * 1024 * 1024; // 轉換為位元組
  const MIN_WIDTH = 1280; // 最小寬度
  const MIN_HEIGHT = 720; // 最小高度
  const MIN_QUALITY = 50; // 最低壓縮品質
  const QUALITY_STEP = 5; // 品質調整步長
  const SCALE_STEP = 0.9; // 尺寸縮放比例

  // 處理 base64 字串，移除 data URI 前綴
  const prefixRegex = /^data:(image\/[a-zA-Z]+);base64,/;
  let base64Data = base64Input;
  if (prefixRegex.test(base64Input)) {
    base64Data = base64Input.replace(prefixRegex, "");
  }

  // 將 base64 轉換為 Buffer
  const inputBuffer = Buffer.from(base64Data, "base64");

  // 獲取原圖資訊
  const metadata = await sharp(inputBuffer).metadata();
  let originalWidth = metadata.width;
  let originalHeight = metadata.height;

  // 計算目標解析度
  let targetWidth = Math.max(originalWidth, MIN_WIDTH);
  let targetHeight = Math.max(originalHeight, MIN_HEIGHT);

  // 根據原圖大小設定初始壓縮品質
  const inputSize = inputBuffer.length;
  let quality = 85; // 預設品質

  if (inputSize < 250 * 1024) {
    quality = 95; // 小於 250KB
  } else if (inputSize < 500 * 1024) {
    quality = 90; // 250KB - 500KB
  } else if (inputSize > MAX_SIZE) {
    // 超過大小限制，每超過 1MB 降低 5 分品質
    const extraMB = Math.floor((inputSize - MAX_SIZE) / (1024 * 1024));
    quality = Math.max(85 - extraMB * QUALITY_STEP, MIN_QUALITY);
  }

  // 迭代壓縮過程
  let outputBuffer;
  let currentQuality = quality;
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    // 使用 sharp 進行圖片處理
    outputBuffer = await sharp(inputBuffer)
      .resize({
        width: currentWidth,
        height: currentHeight,
        fit: "inside", // 保持比例
      })
      .jpeg({ quality: currentQuality })
      .toBuffer();

    // 檢查壓縮結果
    if (outputBuffer.length <= MAX_SIZE) {
      break; // 達到目標大小
    }

    // 調整壓縮參數
    currentQuality = Math.max(MIN_QUALITY, currentQuality - QUALITY_STEP);
    currentWidth = Math.max(MIN_WIDTH, Math.floor(currentWidth * SCALE_STEP));
    currentHeight = Math.max(
      MIN_HEIGHT,
      Math.floor(currentHeight * SCALE_STEP)
    );
    iteration++;
  }

  // 轉換回 base64 格式
  const outputBase64 = outputBuffer.toString("base64");
  return `data:image/jpeg;base64,${outputBase64}`;
}

/**
 * 壓縮圖片 Buffer，使最終檔案大小不超過指定大小，
 * 解析度至少為 1280×720，並轉為 JPEG 編碼。
 *
 * @param {Buffer} inputBuffer - 原始圖片 Buffer
 * @param {number} [MAX_MB=1] - 最大檔案大小限制（MB）
 * @returns {Promise<Buffer>} 壓縮後的圖片 Buffer
 * @throws {Error} 當圖片處理失敗時拋出錯誤
 */
async function compressImageBuffer(inputBuffer, MAX_MB = 1) {
  // 設定壓縮參數
  const MAX_SIZE = MAX_MB * 1024 * 1024;
  const MIN_WIDTH = 1280;
  const MIN_HEIGHT = 720;
  const MIN_QUALITY = 50;
  const QUALITY_STEP = 5;
  const SCALE_STEP = 0.9;

  // 獲取原圖資訊
  const metadata = await sharp(inputBuffer).metadata();
  let originalWidth = metadata.width;
  let originalHeight = metadata.height;

  // 計算目標解析度
  let targetWidth = Math.max(originalWidth, MIN_WIDTH);
  let targetHeight = Math.max(originalHeight, MIN_HEIGHT);

  // 設定初始壓縮品質
  let quality = 85;
  if (inputBuffer.length > MAX_SIZE) {
    const extraMB = Math.floor((inputBuffer.length - MAX_SIZE) / (1024 * 1024));
    quality = Math.max(85 - extraMB * QUALITY_STEP, MIN_QUALITY);
  }

  // 迭代壓縮過程
  let outputBuffer;
  let currentQuality = quality;
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    // 使用 sharp 進行圖片處理
    outputBuffer = await sharp(inputBuffer)
      .resize({
        width: currentWidth,
        height: currentHeight,
        fit: "inside", // 保持比例
      })
      .jpeg({ quality: currentQuality })
      .toBuffer();

    // 檢查壓縮結果
    if (outputBuffer.length <= MAX_SIZE) {
      break; // 達到目標大小
    }

    // 調整壓縮參數
    currentQuality = Math.max(MIN_QUALITY, currentQuality - QUALITY_STEP);
    currentWidth = Math.max(MIN_WIDTH, Math.floor(currentWidth * SCALE_STEP));
    currentHeight = Math.max(
      MIN_HEIGHT,
      Math.floor(currentHeight * SCALE_STEP)
    );
    iteration++;
  }

  return outputBuffer;
}

module.exports.compressBase64Image = compressBase64Image;
module.exports.compressImageBuffer = compressImageBuffer;
