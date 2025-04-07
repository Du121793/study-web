/**
 * @file VimeoMethods.js
 * @description Vimeo 影片管理工具，提供影片上傳、查詢、刪除等功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

require("dotenv").config();
const { Vimeo } = require("@vimeo/vimeo");
const VideoInfo = require("../models/").courseVideoInfo;

// 檢查環境變數
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
if (!VIMEO_ACCESS_TOKEN) {
  console.error("請在 .env 中設定 VIMEO_ACCESS_TOKEN");
  process.exit(1);
}

// 初始化 Vimeo 客戶端
const client = new Vimeo("", "", VIMEO_ACCESS_TOKEN);

/**
 * 將 Vimeo API 請求包裝為 Promise
 * @param {Object} options - 請求選項
 * @param {string} options.method - HTTP 方法
 * @param {string} options.path - API 路徑
 * @param {Object} [options.query] - 查詢參數
 * @param {Object} [options.headers] - 請求標頭
 * @returns {Promise<{data: Object, APILimit: Object}>} API 響應和限制資訊
 */
function vimeoRequest(options) {
  return new Promise((resolve, reject) => {
    client.request(options, (err, body, statusCode, headers) => {
      if (err) return reject(err);
      // 提取 API 限制資訊
      const APILimit = {
        limit: headers["x-ratelimit-limit"],
        remaining: headers["x-ratelimit-remaining"],
        reset: headers["x-ratelimit-reset"],
      };
      resolve({ data: body, APILimit });
    });
  });
}

/**
 * 查找或創建指定名稱的資料夾
 * @param {string} folderName - 資料夾名稱
 * @returns {Promise<{userId: string, folderId: string}>} 用戶 ID 和資料夾 ID
 */
async function findOrCreateFolder(folderName) {
  // 獲取當前用戶資訊
  const meResp = await vimeoRequest({ method: "GET", path: "/me" });
  const me = meResp.data;
  const userId = me.uri.split("/").pop(); // 從 URI 中提取用戶 ID

  // 查詢所有資料夾
  const searchResp = await vimeoRequest({
    method: "GET",
    path: "/me/projects",
    query: { per_page: 100 }, // 增加每頁數量以確保能找到所有資料夾
  });

  // 精確匹配資料夾名稱
  let found = searchResp.data.data.find((p) => p.name === folderName);

  // 如果資料夾不存在，則創建新資料夾
  if (!found) {
    found = await vimeoRequest({
      method: "POST",
      path: "/me/projects",
      query: {
        name: folderName,
      },
    });
    found = found.data;
  }

  // 從 URI 中提取資料夾 ID
  const folderId = found.uri.split("/").pop();
  return { userId, folderId };
}

/**
 * 根據影片索引資訊決定使用哪個資料夾
 * @param {Object} videoIndex - 影片索引資訊
 * @returns {Promise<{userId: string, folderId: string}>} 用戶 ID 和資料夾 ID
 */
async function findOrCreateWebVideosFolder(videoIndex) {
  // 將所有鍵名轉換成大寫
  const upperCaseIndex = Object.fromEntries(
    Object.entries(videoIndex).map(([key, value]) => [key.toUpperCase(), value])
  );

  // 檢查是否有 COURSEID 或 QUESTIONID
  const courseId = upperCaseIndex.COURSEID;
  const questionId = upperCaseIndex.QUESTIONID;

  if (!courseId && !questionId) {
    throw new Error("必須提供 COURSEID 或 QUESTIONID");
  }

  // 決定資料夾名稱
  let folderName;
  if (courseId) {
    folderName = "Course";
  } else if (questionId) {
    folderName = "Question";
  }

  return await findOrCreateFolder(folderName);
}

/**
 * 將元數據寫入影片描述
 * @param {string} originalDesc - 原始描述
 * @param {Object} data - 要添加的元數據
 * @returns {string} 合併後的描述
 */
function buildDescription(originalDesc, data) {
  let desc = originalDesc || "";
  // 將每個元數據項添加到描述中
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      desc += `\n[${key.toUpperCase()}]=${value}`;
    }
  }
  return desc;
}

/**
 * 處理網域字串，提取所有可能的網域格式
 * @param {string} url - 原始 URL
 * @returns {string[]} 處理後的網域列表
 */
function extractDomains(url) {
  try {
    // 移除 http:// 或 https://
    const domainWithPort = url.replace(/^https?:\/\//, "");

    // 分離網域和端口
    const [domain, port] = domainWithPort.split(":");

    if (port) {
      // 如果有端口，返回兩種格式
      return [domainWithPort, domain];
    } else {
      // 如果沒有端口，只返回網域
      return [domain];
    }
  } catch (err) {
    console.error("網域處理錯誤:", err);
    return [];
  }
}

/**
 * 獲取允許的網域列表
 * @returns {string[]} 允許的網域列表
 */
function getAllowedDomains() {
  const domains = new Set(["localhost"]); // 預設允許 localhost

  // 從環境變數獲取 URL
  const urls = [process.env.CLIENT_IP, process.env.SERVER_IP].filter(Boolean); // 過濾掉 undefined 或空值

  // 處理每個 URL
  urls.forEach((url) => {
    if (url) {
      const extractedDomains = extractDomains(url);
      extractedDomains.forEach((domain) => domains.add(domain));
    }
  });
  return Array.from(domains);
}

/**
 * 上傳影片到 Vimeo
 * @param {Object} videoInfo - 影片資訊
 * @param {string} videoInfo.title - 影片標題
 * @param {number} videoInfo.fileSize - 檔案大小
 * @param {string} [videoInfo.description] - 影片描述
 * @param {string} [videoInfo.type] - 影片類型
 * @param {Object} videoIndex - 影片索引資訊
 * @returns {Promise<Object>} 上傳結果
 */
async function uploadVideo(videoInfo, videoIndex) {
  const { title, fileSize, description = "", type } = videoInfo;
  try {
    // 驗證檔案大小
    if (!fileSize || isNaN(fileSize)) {
      throw new Error("fileSize錯誤");
    }

    // 步驟 1: 找到或創建 WebVideos 資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder(videoIndex);

    // 步驟 2: 合併描述資訊
    const finalDesc = buildDescription(description, videoIndex);

    // 步驟 3: 創建影片上傳任務
    const createResp = await vimeoRequest({
      method: "POST",
      path: "/me/videos",
      headers: {
        "Content-Type": "application/json",
      },
      query: {
        upload: {
          approach: "tus",
          size: fileSize,
        },
        name: title,
        description: finalDesc,
        privacy: {
          view: "disable",
          embed: "public",
        },
        embed: {
          buttons: {
            like: false,
            watchlater: false,
            share: false,
            embed: false,
          },
          logos: {
            vimeo: false,
          },
          title: {
            name: "hide",
            owner: "hide",
            portrait: "hide",
          },
        },
      },
    });

    // 驗證上傳連結
    if (!createResp.data.upload || !createResp.data.upload.upload_link) {
      throw new Error("Vimeo 回傳無 upload_link");
    }
    const videoId = createResp.data.uri.split("/").pop();

    // 步驟 4: 將影片添加到資料夾
    const addFolderResp = await vimeoRequest({
      method: "PUT",
      path: `/users/${userId}/projects/${folderId}/videos/${videoId}`,
    });

    // 返回上傳結果
    return {
      success: true,
      vimeoUri: createResp.data.uri,
      videoId: videoIndex.videoID,
      uploadLink: createResp.data.upload.upload_link,
      APILimit: addFolderResp.APILimit,
    };
  } catch (err) {
    // 錯誤處理：嘗試刪除已創建的影片
    try {
      await deleteVideo({ videoID: videoIndex.videoID });
    } catch (delErr) {
      return {
        success: false,
        msg: "Vimeo API 錯誤",
        error: delErr.message,
      };
    }
    // 刪除資料庫中的影片記錄
    await VideoInfo.findOneAndDelete({ _id: videoIndex.videoID });
    return {
      success: false,
      msg: "Vimeo API 錯誤：" + err.message,
      error: err.message,
    };
  }
}

/**
 * 查找符合條件的影片
 * @param {Object} [videoIndex={}] - 影片索引條件
 * @returns {Promise<Object>} 查詢結果
 */
async function findVideo(videoIndex = {}) {
  try {
    // 檢查是否有查詢條件
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }

    // 步驟 1: 獲取用戶資訊和對應資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder(videoIndex);

    // 步驟 2: 分頁獲取所有影片
    let allVideos = [];
    let page = 1;
    let perPage = 100;
    let lastAPILimit = {};
    while (true) {
      const videosResp = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${folderId}/videos`,
        query: {
          per_page: perPage,
          page: page,
          sort: "date",
          direction: "desc",
        },
      });
      lastAPILimit = videosResp.APILimit;
      allVideos.push(...videosResp.data.data);
      if (videosResp.data.data.length < perPage) break;
      page++;
    }

    // 步驟 3: 根據描述篩選影片
    function matchDescription(videoDesc, conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        if (value) {
          const upperKey = key.toUpperCase();
          if (!videoDesc.includes(`[${upperKey}]=${value}`)) {
            return false;
          }
        }
      }
      return true;
    }
    const filtered = allVideos.filter((video) =>
      matchDescription(video.description || "", videoIndex)
    );

    // 返回查詢結果
    return {
      success: true,
      total: filtered.length,
      data: filtered,
      APILimit: lastAPILimit,
    };
  } catch (err) {
    // 錯誤處理
    let errorObj;
    try {
      errorObj = JSON.parse(err.message);
    } catch (parseError) {
      errorObj = { error: err.message };
    }
    return {
      success: false,
      message: "搜尋失敗：" + err.message,
      error: errorObj,
      APILimit: {},
    };
  }
}

/**
 * 刪除 Vimeo 影片
 * @param {Object} videoIndex - 影片索引資訊
 * @returns {Promise<Object>} 刪除結果
 */
async function deleteVideo(videoIndex) {
  try {
    // 檢查是否有刪除條件
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }

    // 步驟 1: 獲取用戶資訊和對應資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder(videoIndex);

    // 步驟 2: 分頁獲取所有影片
    let allVideos = [];
    let page = 1;
    let perPage = 100;
    let lastAPILimit = {};
    while (true) {
      const videosResp = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${folderId}/videos`,
        query: {
          per_page: perPage,
          page: page,
          sort: "date",
          direction: "desc",
        },
      });
      lastAPILimit = videosResp.APILimit;
      allVideos.push(...videosResp.data.data);
      if (videosResp.data.data.length < perPage) break;
      page++;
    }

    // 步驟 3: 根據描述篩選影片
    function matchDescription(videoDesc, conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        if (value) {
          const upperKey = key.toUpperCase();
          if (!videoDesc.includes(`[${upperKey}]=${value}`)) return false;
        }
      }
      return true;
    }
    const filtered = allVideos.filter((video) =>
      matchDescription(video.description || "", videoIndex)
    );

    // 步驟 4: 刪除符合條件的影片
    let lastDeleteAPILimit = {};
    for (const vid of filtered) {
      const deleteResp = await vimeoRequest({
        method: "DELETE",
        path: vid.uri,
      });
      lastDeleteAPILimit = deleteResp.APILimit;
    }

    // 返回刪除結果
    return {
      success: true,
      total: filtered.length,
      data: filtered,
      APILimit: lastDeleteAPILimit,
    };
  } catch (err) {
    // 錯誤處理
    let errorObj;
    try {
      errorObj = JSON.parse(err.message);
    } catch (parseError) {
      errorObj = { error: err.message };
    }
    return {
      success: false,
      message: "刪除失敗：" + err.message,
      error: errorObj,
      APILimit: {},
    };
  }
}

module.exports.delete = deleteVideo;
module.exports.find = findVideo;
module.exports.upload = uploadVideo;
