const sharp = require("sharp");

/**
 * 壓縮並轉換 base64 圖片，使最終檔案大小不超過 2MB，
 * 解析度至少為 1280×720，並轉為 JPEG 編碼。
 * 當原圖超過 2MB時，會依超過程度降低壓縮品質；2MB以下則僅輕微壓縮。
 *
 * @param {string} base64Input - 包含前綴的 base64 圖片 (例如: data:image/png;base64,...)
 * @returns {Promise<string>} - 壓縮後並加上 JPEG 前綴的 base64 圖片
 */
async function compressBase64Image(base64Input, MAX_MB = 1) {
  const MAX_SIZE = MAX_MB * 1024 * 1024; // 2MB in bytes
  const MIN_WIDTH = 1280;
  const MIN_HEIGHT = 720;
  const MIN_QUALITY = 50; // 壓縮品質最低值
  const QUALITY_STEP = 5; // 每次降低品質的步長
  const SCALE_STEP = 0.9; // 每次縮小解析度的比例

  // 移除 data URI 前綴
  const prefixRegex = /^data:(image\/[a-zA-Z]+);base64,/;
  let base64Data = base64Input;
  if (prefixRegex.test(base64Input)) {
    base64Data = base64Input.replace(prefixRegex, "");
  }

  // 轉換成 Buffer
  const inputBuffer = Buffer.from(base64Data, "base64");

  // 取得原圖元數據
  const metadata = await sharp(inputBuffer).metadata();
  let originalWidth = metadata.width;
  let originalHeight = metadata.height;

  // 設定初始目標解析度：
  // 若原圖小於最低要求，則以最低解析度為準；否則保留原尺寸
  let targetWidth = originalWidth < MIN_WIDTH ? MIN_WIDTH : originalWidth;
  let targetHeight = originalHeight < MIN_HEIGHT ? MIN_HEIGHT : originalHeight;

  // 根據原圖檔案大小設定初始品質：
  // 2MB以下初始品質設定為 85；超過 2MB，每超過 1MB降低 5 分（最低 50）
  const inputSize = inputBuffer.length;
  let quality;

  if (inputSize < 250 * 1024) {
    // 小於250KB
    quality = 95;
  } else if (inputSize < 500 * 1024) {
    // 小於500KB，但至少250KB
    quality = 90;
  } else if (inputSize <= MAX_SIZE) {
    // 介於500KB和2MB之間
    quality = 85;
  } else {
    // 超過2MB，每超過1MB降低 5 分，最低 50
    const extraMB = Math.floor((inputSize - MAX_SIZE) / (1024 * 1024));
    quality = 85 - extraMB * QUALITY_STEP;
    if (quality < MIN_QUALITY) quality = MIN_QUALITY;
  }

  let outputBuffer;
  let currentQuality = quality;
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let iteration = 0;
  const maxIterations = 10; // 防止無限迴圈

  while (iteration < maxIterations) {
    // 使用 sharp 調整解析度與 JPEG 壓縮品質
    outputBuffer = await sharp(inputBuffer)
      .resize({
        width: currentWidth,
        height: currentHeight,
        fit: "inside", // 保持比例，不會扭曲
      })
      .jpeg({ quality: currentQuality })
      .toBuffer();

    if (outputBuffer.length <= MAX_SIZE) {
      // 檔案大小符合要求，跳出迴圈
      break;
    } else {
      // 若壓縮後檔案仍超過 2MB，降低品質與解析度後重試
      currentQuality = currentQuality - QUALITY_STEP;
      if (currentQuality < MIN_QUALITY) currentQuality = MIN_QUALITY;
      // 按 SCALE_STEP 縮小解析度，但不低於最低要求
      currentWidth = Math.max(MIN_WIDTH, Math.floor(currentWidth * SCALE_STEP));
      currentHeight = Math.max(
        MIN_HEIGHT,
        Math.floor(currentHeight * SCALE_STEP)
      );
    }
    iteration++;
  }

  // 加回 JPEG 的 data URI 前綴
  const outputBase64 = outputBuffer.toString("base64");
  const result = `data:image/jpeg;base64,${outputBase64}`;
  return result;
}

async function compressImageBuffer(inputBuffer, MAX_MB = 1) {
  const MAX_SIZE = MAX_MB * 1024 * 1024; // 2MB
  const MIN_WIDTH = 1280;
  const MIN_HEIGHT = 720;
  const MIN_QUALITY = 50; // 最低 JPEG 壓縮品質
  const QUALITY_STEP = 5; // 每次降低品質的步長
  const SCALE_STEP = 0.9; // 每次縮小解析度的比例

  // 取得原圖元數據
  const metadata = await sharp(inputBuffer).metadata();
  let originalWidth = metadata.width;
  let originalHeight = metadata.height;

  // 設定初始目標解析度：若原圖小於最低要求，則使用最低尺寸
  let targetWidth = originalWidth < MIN_WIDTH ? MIN_WIDTH : originalWidth;
  let targetHeight = originalHeight < MIN_HEIGHT ? MIN_HEIGHT : originalHeight;

  // 根據原圖大小設定初始品質：若超過 2MB，則品質降低
  let quality = 85;
  if (inputBuffer.length > MAX_SIZE) {
    const extraMB = Math.floor((inputBuffer.length - MAX_SIZE) / (1024 * 1024));
    quality = 85 - extraMB * QUALITY_STEP;
    if (quality < MIN_QUALITY) quality = MIN_QUALITY;
  }

  let outputBuffer;
  let currentQuality = quality;
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    outputBuffer = await sharp(inputBuffer)
      .resize({
        width: currentWidth,
        height: currentHeight,
        fit: "inside", // 保持原圖比例，不扭曲
      })
      .jpeg({ quality: currentQuality })
      .toBuffer();

    if (outputBuffer.length <= MAX_SIZE) {
      // 壓縮後檔案符合大小要求
      break;
    } else {
      // 若還超過 2MB，則進一步降低品質並縮小解析度
      currentQuality = Math.max(MIN_QUALITY, currentQuality - QUALITY_STEP);
      currentWidth = Math.max(MIN_WIDTH, Math.floor(currentWidth * SCALE_STEP));
      currentHeight = Math.max(
        MIN_HEIGHT,
        Math.floor(currentHeight * SCALE_STEP)
      );
    }
    iteration++;
  }
  return outputBuffer;
}

module.exports.compressBase64Image = compressBase64Image;
module.exports.compressImageBuffer = compressImageBuffer;
