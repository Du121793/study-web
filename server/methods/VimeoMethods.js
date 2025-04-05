/**
 * @file VimeoMethods.js
 * @description Vimeo 影片管理工具，提供影片上傳、查詢、刪除等功能
 * @author StudyWeb Team
 * @date 2024-03-30
 */

require("dotenv").config();
const { Vimeo } = require("@vimeo/vimeo");
const VideoInfo = require("../models/").courseVideoInfo;
const fs = require("fs");
const path = require("path");

// 讀取配置文件
const CONFIG_PATH = path.join(__dirname, "../config/vimeoConfig.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

// 解析時間字串為毫秒數
function parseTimeString(timeStr) {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1));

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`不支援的時間單位: ${unit}`);
  }
}

// 緩存文件路徑
const CACHE_FILE_PATH = path.join(__dirname, "vimeoPathCache.json");

// 從配置文件讀取緩存過期時間
const CACHE_TTL = parseTimeString(config.cache.expireTime);
const PROJECTS_CACHE_TTL = parseTimeString(config.cache.projectsCacheTime);

// 讀取緩存文件
function readPathCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("讀取緩存文件失敗:", err);
  }
  return { WebVideos: {} };
}

// 寫入緩存文件
function writePathCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), "utf8");
  } catch (err) {
    console.error("寫入緩存文件失敗:", err);
  }
}

// 添加路徑緩存
let pathCache = readPathCache();

// 檢查環境變數
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
if (!VIMEO_ACCESS_TOKEN) {
  console.error("請在 .env 中設定 VIMEO_ACCESS_TOKEN");
  process.exit(1);
}

// 初始化 Vimeo 客戶端
const client = new Vimeo("", "", VIMEO_ACCESS_TOKEN);

// 添加緩存
let projectsCache = {
  data: null,
  timestamp: 0,
  ttl: PROJECTS_CACHE_TTL,
};

// 添加全局路徑管理
let pathManager = {
  currentPath: null, // 當前完整路徑
  targetFolders: [], // 目標文件夾名稱陣列
  folderIds: {}, // 保存各層級文件夾的ID

  // 初始化路徑
  init(folders) {
    this.currentPath = "";
    this.targetFolders = [...folders];
    this.folderIds = {};
  },

  // 添加新的路徑段
  addPath(folderName, folderId) {
    this.currentPath = this.currentPath
      ? `${this.currentPath}/${folderName}`
      : folderName;
    this.folderIds[folderName] = folderId;
  },

  // 獲取下一個目標文件夾名稱
  getNextTarget() {
    return this.targetFolders.shift();
  },

  // 獲取當前路徑的最後一個文件夾ID
  getCurrentFolderId() {
    const lastFolder = this.currentPath.split("/").pop();
    return this.folderIds[lastFolder];
  },
};

/**
 * 將 Vimeo API 請求包裝為 Promise
 * @param {Object} options - API 請求選項
 * @returns {Promise} API 響應結果
 */
function vimeoRequest(options) {
  return new Promise((resolve, reject) => {
    client.request(options, (err, body, statusCode, headers) => {
      if (err) return reject(err);
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
 * 取得目前使用者的 userId
 * @returns {Promise<string>} 使用者 ID
 */
async function getUserId() {
  const meResp = await vimeoRequest({ method: "GET", path: "/me" });
  const me = meResp.data;
  return me.uri.split("/").pop();
}

/**
 * 獲取所有專案，帶緩存機制
 * @param {boolean} forceRefresh - 是否強制刷新緩存
 * @param {number} perPage - 每頁數量
 * @returns {Promise<Array>} 專案列表
 */
async function getAllProjects(forceRefresh = false, perPage = 50) {
  const now = Date.now();

  // 如果緩存有效且不強制刷新，直接返回緩存
  if (
    !forceRefresh &&
    projectsCache.data &&
    now - projectsCache.timestamp < projectsCache.ttl
  ) {
    return projectsCache.data;
  }

  let page = 1;
  let allProjects = [];

  while (true) {
    const resp = await vimeoRequest({
      method: "GET",
      path: "/me/projects",
      query: { per_page: perPage, page },
    });
    allProjects.push(...resp.data.data);
    if (resp.data.data.length < perPage) break;
    page++;
  }

  // 更新緩存
  projectsCache.data = allProjects;
  projectsCache.timestamp = now;

  return allProjects;
}

/**
 * 在指定父資料夾下，尋找名稱符合的子資料夾
 * @param {Array} projectsList - 專案列表
 * @param {string} folderName - 資料夾名稱
 * @param {string} parentUri - 父資料夾 URI
 * @returns {Object|null} 找到的資料夾
 */
function findProjectByNameAndParent(projectsList, folderName, parentUri) {
  // 先找出所有名称匹配的文件夹（不区分大小写）
  const matchingFolders = projectsList.filter(
    (p) => p.name.toLowerCase() === folderName.toLowerCase()
  );

  if (matchingFolders.length === 0) {
    return null;
  }

  // 如果在找顶层文件夹
  if (!parentUri) {
    // 先找沒有父文件夾的
    const found = matchingFolders.find((p) => !p.parent_folder);
    if (found) {
      return found;
    }
    // 如果沒找到，返回第一個匹配的（可能需要移動）
    return matchingFolders[0];
  }

  // 如果在找子文件夹，检查父文件夹URI
  const found = matchingFolders.find(
    (p) => p.parent_folder && p.parent_folder.uri === parentUri
  );

  if (!found) {
    // 如果沒找到正確位置的，返回第一個匹配的（可能需要移動）
    return matchingFolders[0];
  }

  return found;
}

/**
 * 建立資料夾
 * @param {string} userId - 使用者 ID
 * @param {string} name - 資料夾名稱
 * @param {string} parentFolderUri - 父資料夾 URI
 * @returns {Promise<Object>} 建立的資料夾
 */
async function createProject(userId, name, parentFolderUri = null) {
  const query = { name };
  if (parentFolderUri) {
    query.parent_folder_uri = parentFolderUri;
  }
  const createResp = await vimeoRequest({
    method: "POST",
    path: `/users/${userId}/projects`,
    query,
  });
  return createResp.data;
}

/**
 * 將所有 key 轉成大寫並解析出 subRootName 與 targetId
 * @param {Object} videoIndex - 影片索引
 * @returns {Object|null} 解析結果
 */
function parseVideoIndex(videoIndex) {
  console.log("解析 videoIndex:", videoIndex);

  const upperIndex = {};
  for (const [k, v] of Object.entries(videoIndex)) {
    if (!v) continue;
    upperIndex[k.toUpperCase()] = v.toString(); // 保持原值，不转大写
  }

  if (upperIndex["COURSEID"]) {
    return {
      isCourse: true,
      subRootName: "Course",
      targetId: upperIndex["COURSEID"],
    };
  }
  if (upperIndex["QUESTIONID"]) {
    return {
      isCourse: false,
      subRootName: "Question",
      targetId: upperIndex["QUESTIONID"],
    };
  }
  return null;
}

/**
 * 移動資料夾到新的父資料夾
 * @param {string} userId - 使用者 ID
 * @param {string} folderId - 資料夾 ID
 * @param {string} newParentUri - 新父資料夾 URI
 * @returns {Promise<Object>} 移動後的資料夾
 */
async function moveFolder(userId, folderId, newParentUri) {
  console.log(`移動文件夾 ${folderId} 到 ${newParentUri}`);

  const maxRetries = 3;
  let lastError = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // 先检查文件夹当前状态
      const beforeCheck = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${folderId}`,
      });

      console.log("移動前文件夾狀態:", {
        name: beforeCheck.data.name,
        uri: beforeCheck.data.uri,
        parent: beforeCheck.data.parent_folder?.uri,
      });

      // 如果已经在正确位置，直接返回
      if (beforeCheck.data.parent_folder?.uri === newParentUri) {
        console.log("文件夾已在正確位置");
        return beforeCheck.data;
      }

      // 执行移动
      const moveResp = await vimeoRequest({
        method: "PATCH",
        path: `/users/${userId}/projects/${folderId}`,
        query: {
          parent_folder_uri: newParentUri,
        },
        headers: {
          "Content-Type": "application/json",
        },
        json: true,
      });

      // 等待移动完成
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 验证移动结果
      const afterCheck = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${folderId}`,
      });

      console.log("移動後文件夾狀態:", {
        name: afterCheck.data.name,
        uri: afterCheck.data.uri,
        parent: afterCheck.data.parent_folder?.uri,
        raw: JSON.stringify(afterCheck.data, null, 2),
      });

      // 检查移动是否成功
      if (!afterCheck.data.parent_folder) {
        throw new Error(
          `文件夾移動後無父文件夾信息: ${JSON.stringify(afterCheck.data)}`
        );
      }

      if (afterCheck.data.parent_folder.uri !== newParentUri) {
        throw new Error(
          `文件夾移動驗證失敗: 期望父文件夾為 ${newParentUri}，實際為 ${afterCheck.data.parent_folder.uri}`
        );
      }

      console.log("文件夾移動成功並驗證通過");
      return afterCheck.data;
    } catch (err) {
      lastError = err;
      console.error(`移動文件夾重試 ${i + 1}/${maxRetries} 失敗:`, err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error(`移動文件夾失敗 (重試${maxRetries}次): ${lastError.message}`);
}

/**
 * 在指定父層中找或建「folderName」資料夾
 */
async function findOrCreateFolder(projectsList, userId, folderName, parentUri) {
  // 先檢查：在這個 parentUri 下是否已有同名資料夾
  let folder = findProjectByNameAndParent(projectsList, folderName, parentUri);

  if (folder) {
    return folder;
  }

  // 如果沒找到，直接創建新文件夾
  const created = await createProject(userId, folderName, parentUri);
  projectsList.push(created);

  // 等待文件夹创建完成
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 验证新创建的文件夹
  const verifyFolder = await vimeoRequest({
    method: "GET",
    path: `/users/${userId}/projects/${created.uri.split("/").pop()}`,
  });

  if (!verifyFolder.data || !verifyFolder.data.uri) {
    throw new Error("新文件夾創建驗證失敗");
  }

  return verifyFolder.data;
}

/**
 * 根據路徑查找文件夾
 */
async function findFolderByPath(path) {
  console.log(`根據路徑查找文件夾: ${path}`);

  // 分割路徑
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const projectsList = await getAllProjects();
  let currentFolder = null;

  // 遍歷路徑
  for (const part of parts) {
    const parentUri = currentFolder ? currentFolder.uri : null;
    currentFolder = findProjectByNameAndParent(projectsList, part, parentUri);

    if (!currentFolder) {
      console.log(`在路徑 ${path} 中找不到文件夾 ${part}`);
      return null;
    }
  }

  return currentFolder;
}

/**
 * 清理过期的緩存
 */
function cleanExpiredCache() {
  const now = Date.now();
  let current = pathCache.WebVideos;

  // 清理 Course 和 Question 的过期緩存
  ["Course", "Question"].forEach((section) => {
    if (current[section] && current[section].ids) {
      current[section].ids = current[section].ids.filter((item) => {
        return item.timestamp && now - item.timestamp < CACHE_TTL;
      });
    }
  });

  writePathCache(pathCache);
}

/**
 * 檢查路徑緩存中是否存在指定路徑
 */
function checkPathInCache(pathArray) {
  // 清理过期緩存
  cleanExpiredCache();

  let current = pathCache;

  // 检查 WebVideos
  if (!current.WebVideos) return null;
  current = current.WebVideos;

  // 检查 Course/Question
  if (pathArray[1] && current[pathArray[1]]) {
    current = current[pathArray[1]];

    // 如果是查找具体的课程/问题ID
    if (pathArray[2]) {
      const targetId = pathArray[2];
      const found = current.ids.find((item) => item.id === targetId);
      if (found) {
        // 检查是否过期
        if (found.timestamp && Date.now() - found.timestamp < CACHE_TTL) {
          return { id: found.path };
        } else {
          // 如果过期，删除该緩存
          deletePathFromCache(pathArray);
          return null;
        }
      }
    } else {
      return current;
    }
  }

  return null;
}

/**
 * 更新路徑緩存
 */
function updatePathCache(pathArray, folderId) {
  let current = pathCache;

  // 确保基本结构存在
  if (!current.WebVideos) {
    current.WebVideos = {
      id: null,
      Course: { id: null, ids: [] },
      Question: { id: null, ids: [] },
    };
  }
  current = current.WebVideos;

  // 更新 WebVideos 的 ID
  if (pathArray.length === 1) {
    current.id = folderId;
    writePathCache(pathCache);
    return;
  }

  // 更新 Course/Question 的 ID
  if (pathArray.length === 2) {
    current[pathArray[1]].id = folderId;
    writePathCache(pathCache);
    return;
  }

  // 更新具体课程/问题的 ID
  if (pathArray.length === 3) {
    const section = current[pathArray[1]];
    const targetId = pathArray[2];

    // 查找是否已存在
    const existingIndex = section.ids.findIndex((item) => item.id === targetId);
    if (existingIndex !== -1) {
      // 更新现有记录
      section.ids[existingIndex] = {
        id: targetId,
        path: folderId,
        timestamp: Date.now(),
      };
    } else {
      // 添加新记录
      section.ids.push({
        id: targetId,
        path: folderId,
        timestamp: Date.now(),
      });
    }

    writePathCache(pathCache);
  }
}

/**
 * 刪除路徑緩存
 */
function deletePathFromCache(pathArray) {
  let current = pathCache;

  if (!current.WebVideos) return;
  current = current.WebVideos;

  if (pathArray.length === 3) {
    // 删除特定课程/问题ID
    const section = current[pathArray[1]];
    if (section && section.ids) {
      const targetId = pathArray[2];
      section.ids = section.ids.filter((item) => item.id !== targetId);
      writePathCache(pathCache);
    }
  } else if (pathArray.length === 2) {
    // 删除整个 Course/Question 的緩存
    if (current[pathArray[1]]) {
      current[pathArray[1]] = { id: null, ids: [] };
      writePathCache(pathCache);
    }
  } else if (pathArray.length === 1) {
    // 重置整个 WebVideos 緩存
    pathCache.WebVideos = {
      id: null,
      Course: { id: null, ids: [] },
      Question: { id: null, ids: [] },
    };
    writePathCache(pathCache);
  }
}

/**
 * 驗證資料夾是否存在且名稱正確
 * @param {string} userId - 使用者 ID
 * @param {string} folderId - 資料夾 ID
 * @param {string} expectedName - 預期的資料夾名稱
 * @returns {Promise<boolean>} 驗證結果
 */
async function verifyFolder(userId, folderId, expectedName) {
  try {
    const folderCheck = await vimeoRequest({
      method: "GET",
      path: `/users/${userId}/projects/${folderId}`,
    });

    if (!folderCheck.data || !folderCheck.data.uri) {
      console.warn(`資料夾 ${folderId} 不存在`);
      return false;
    }

    if (folderCheck.data.name !== expectedName) {
      console.warn(
        `資料夾名稱不匹配: 預期 ${expectedName}, 實際 ${folderCheck.data.name}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(`驗證資料夾失敗 ${folderId}:`, err.message);
    return false;
  }
}

/**
 * 檢查並建立多層資料夾結構
 */
async function findOrCreateWebVideosFolder(videoIndex) {
  const parseResult = parseVideoIndex(videoIndex);
  if (!parseResult) {
    throw new Error("請至少提供 COURSEID 或 QUESTIONID");
  }

  const { subRootName, targetId } = parseResult;
  const pathArray = ["WebVideos", subRootName, targetId];

  // 檢查緩存
  const cachedPath = checkPathInCache(pathArray);
  if (cachedPath && cachedPath.id) {
    try {
      const userId = await getUserId();

      // 验证缓存的每一层文件夹
      let isValid = true;
      let currentPath = [];

      for (const folder of pathArray) {
        currentPath.push(folder);
        let current = pathCache;
        for (const p of currentPath) {
          current = current[p];
        }

        if (current && current.id) {
          const valid = await verifyFolder(userId, current.id, folder);
          if (!valid) {
            isValid = false;
            break;
          }
        }
      }

      if (isValid) {
        return {
          userId,
          folderId: cachedPath.id,
        };
      }

      // 如果验证失败，删除缓存并重新创建
      console.warn("缓存验证失败，重新创建文件夹结构");
      deletePathFromCache(pathArray);
    } catch (err) {
      console.error("验证缓存失败:", err.message);
      deletePathFromCache(pathArray);
    }
  }

  // 初始化路徑管理器
  pathManager.init(pathArray);

  const userId = await getUserId();
  let projectsList = await getAllProjects(true);

  let currentParentUri = null;
  let createdFolders = new Set();

  // 遍歷創建文件夾結構
  while (pathManager.targetFolders.length > 0) {
    const nextFolderName = pathManager.getNextTarget();
    const currentPath = pathArray.slice(
      0,
      pathArray.indexOf(nextFolderName) + 1
    );

    // 查找現有文件夾
    let folder = findProjectByNameAndParent(
      projectsList,
      nextFolderName,
      currentParentUri
    );

    if (!folder) {
      // 檢查是否已在此層級創建過文件夾
      if (createdFolders.has(nextFolderName)) {
        throw new Error(
          `無法找到文件夾 ${nextFolderName} 且已在此層級創建過文件夾`
        );
      }

      folder = await findOrCreateFolder(
        projectsList,
        userId,
        nextFolderName,
        currentParentUri
      );
      createdFolders.add(nextFolderName);
    }

    // 验证找到的文件夹
    const isValid = await verifyFolder(
      userId,
      folder.uri.split("/").pop(),
      nextFolderName
    );
    if (!isValid) {
      throw new Error(`文件夾驗證失敗: ${nextFolderName}`);
    }

    // 更新路徑信息
    pathManager.addPath(nextFolderName, folder.uri.split("/").pop());
    currentParentUri = folder.uri;

    // 更新緩存
    updatePathCache(currentPath, folder.uri.split("/").pop());
  }

  return {
    userId,
    folderId: pathManager.getCurrentFolderId(),
  };
}

/**
 * 將元數據寫入影片描述
 */
function buildDescription(originalDesc, data) {
  let desc = originalDesc || "";
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      desc += `\n[${key.toUpperCase()}]=${value.toString()}`;
    }
  }
  return desc;
}

// ============= 上傳影片 =============
async function uploadVideo(videoInfo, videoIndex) {
  const { title, fileSize, description = "" } = videoInfo;
  try {
    if (!fileSize || isNaN(fileSize)) {
      throw new Error("fileSize錯誤");
    }

    // 獲取或創建資料夾結構
    const { userId, folderId } = await findOrCreateWebVideosFolder(videoIndex);

    // 驗證資料夾是否存在且正確
    const folderCheck = await vimeoRequest({
      method: "GET",
      path: `/users/${userId}/projects/${folderId}`,
    });

    if (!folderCheck.data || !folderCheck.data.uri) {
      throw new Error("目標資料夾驗證失敗");
    }

    const finalDesc = buildDescription(description, videoIndex);

    const createResp = await vimeoRequest({
      method: "POST",
      path: "/me/videos",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
      query: {
        upload: { approach: "tus", size: fileSize },
        name: title,
        description: finalDesc,
        privacy: { view: "nobody" },
      },
    });

    if (!createResp.data.upload || !createResp.data.upload.upload_link) {
      throw new Error(
        `Vimeo 回傳無 upload_link: ${JSON.stringify(createResp.data)}`
      );
    }

    const videoId = createResp.data.uri.split("/").pop();

    // 確保資料夾存在後再放入影片
    const addFolderResp = await vimeoRequest({
      method: "PUT",
      path: `/users/${userId}/projects/${folderId}/videos/${videoId}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    });

    // 返回上傳所需的所有信息
    return {
      success: true,
      vimeoUri: createResp.data.uri,
      videoId: videoIndex.videoID,
      uploadLink: createResp.data.upload.upload_link,
      uploadData: {
        approach: createResp.data.upload.approach,
        size: fileSize,
        link: createResp.data.upload.upload_link,
        videoId: videoId,
      },
      APILimit: addFolderResp.APILimit,
    };
  } catch (err) {
    // 若失敗，嘗試刪除已創建的影片
    if (videoIndex.videoID) {
      try {
        await deleteVideo({ videoID: videoIndex.videoID });
      } catch (delErr) {
        console.error("刪除失敗的影片時出錯:", delErr);
      }
      try {
        await VideoInfo.findOneAndDelete({ _id: videoIndex.videoID });
      } catch (dbErr) {
        console.error("從數據庫刪除影片記錄時出錯:", dbErr);
      }
    }
    return {
      success: false,
      msg: "Vimeo API 錯誤：" + (err.message || err.toString()),
      error: err.message || err.toString(),
      details: err.stack,
    };
  }
}

// ============= 查找影片 =============
async function findVideo(videoIndex = {}) {
  try {
    const parseResult = parseVideoIndex(videoIndex);
    if (!parseResult) {
      // 若沒有 COURSEID/QUESTIONID 就直接回傳空
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    const { subRootName, targetId } = parseResult;

    const userId = await getUserId();
    const projectsList = await getAllProjects();

    // (1) 找 WebVideos
    const webVideos = findProjectByNameAndParent(
      projectsList,
      "WebVideos",
      null
    );

    if (!webVideos) return { success: true, total: 0, data: [], APILimit: {} };

    // (2) 找 (Course/Question)
    const subRoot = findProjectByNameAndParent(
      projectsList,
      subRootName,
      webVideos.uri
    );

    if (!subRoot) return { success: true, total: 0, data: [], APILimit: {} };

    // (3) 找 targetId
    const finalFolder = findProjectByNameAndParent(
      projectsList,
      targetId,
      subRoot.uri
    );

    if (!finalFolder)
      return { success: true, total: 0, data: [], APILimit: {} };

    // 撈取該資料夾底下影片
    let allVideos = [];
    let page = 1;
    let perPage = 100;
    let lastAPILimit = {};
    while (true) {
      const videosResp = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${finalFolder.uri
          .split("/")
          .pop()}/videos`,
        query: { per_page: perPage, page, sort: "date", direction: "desc" },
      });
      lastAPILimit = videosResp.APILimit;
      allVideos.push(...videosResp.data.data);
      if (videosResp.data.data.length < perPage) break;
      page++;
    }

    // 根據描述過濾
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

    return {
      success: true,
      total: filtered.length,
      data: filtered,
      APILimit: lastAPILimit,
    };
  } catch (err) {
    let errorObj;
    try {
      errorObj = JSON.parse(err.message);
    } catch (_) {
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
 * 檢查文件夾是否為空
 */
async function isFolderEmpty(userId, folderId) {
  try {
    const videosResp = await vimeoRequest({
      method: "GET",
      path: `/users/${userId}/projects/${folderId}/videos`,
      query: { per_page: 1, page: 1 },
    });
    return videosResp.data.data.length === 0;
  } catch (err) {
    return false;
  }
}

/**
 * 刪除空文件夾
 */
async function deleteEmptyFolder(userId, folderId) {
  try {
    // 先获取文件夹信息，用于后续删除缓存
    const folderInfo = await vimeoRequest({
      method: "GET",
      path: `/users/${userId}/projects/${folderId}`,
    });

    // 执行删除操作
    await vimeoRequest({
      method: "DELETE",
      path: `/users/${userId}/projects/${folderId}`,
    });

    // 在緩存中查找並刪除對應的資料夾ID
    if (pathCache.WebVideos) {
      let current = pathCache.WebVideos;

      // 檢查 WebVideos 根資料夾
      if (current.id === folderId) {
        current.id = null;
      }

      // 檢查 Course 和 Question
      ["Course", "Question"].forEach((section) => {
        if (current[section]) {
          // 檢查 section 級別
          if (current[section].id === folderId) {
            current[section].id = null;
          }

          // 檢查 ids 陣列
          if (current[section].ids) {
            // 通過資料夾名稱和 ID 雙重檢查
            current[section].ids = current[section].ids.filter((item) => {
              const shouldKeep = item.path !== folderId;
              if (!shouldKeep) {
                console.log(`刪除緩存: ${section} - ${item.id}`);
              }
              return shouldKeep;
            });
          }
        }
      });

      writePathCache(pathCache);
    }

    return true;
  } catch (err) {
    console.error("删除文件夹失败:", err);
    return false;
  }
}

// ============= 刪除影片 =============
async function deleteVideo(videoIndex) {
  try {
    const parseResult = parseVideoIndex(videoIndex);
    if (!parseResult) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    const { subRootName, targetId } = parseResult;

    const userId = await getUserId();
    const projectsList = await getAllProjects();

    const webVideos = findProjectByNameAndParent(
      projectsList,
      "WebVideos",
      null
    );
    if (!webVideos) return { success: true, total: 0, data: [], APILimit: {} };

    const subRoot = findProjectByNameAndParent(
      projectsList,
      subRootName,
      webVideos.uri
    );
    if (!subRoot) return { success: true, total: 0, data: [], APILimit: {} };

    const finalFolder = findProjectByNameAndParent(
      projectsList,
      targetId,
      subRoot.uri
    );
    if (!finalFolder)
      return { success: true, total: 0, data: [], APILimit: {} };

    // 撈影片
    let allVideos = [];
    let page = 1;
    let perPage = 100;
    let lastAPILimit = {};
    while (true) {
      const videosResp = await vimeoRequest({
        method: "GET",
        path: `/users/${userId}/projects/${finalFolder.uri
          .split("/")
          .pop()}/videos`,
        query: { per_page: perPage, page, sort: "date", direction: "desc" },
      });
      lastAPILimit = videosResp.APILimit;
      allVideos.push(...videosResp.data.data);
      if (videosResp.data.data.length < perPage) break;
      page++;
    }

    // 過濾
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

    let lastDeleteAPILimit = {};
    for (const vid of filtered) {
      const deleteResp = await vimeoRequest({
        method: "DELETE",
        path: vid.uri,
      });
      lastDeleteAPILimit = deleteResp.APILimit;
    }

    // 只檢查並刪除特定 ID 的文件夾
    const finalFolderId = finalFolder.uri.split("/").pop();
    if (await isFolderEmpty(userId, finalFolderId)) {
      const deleted = await deleteEmptyFolder(userId, finalFolderId);

      // 更新緩存
      if (deleted) {
        projectsCache.data = projectsCache.data.filter(
          (p) => p.uri !== finalFolder.uri
        );
      }
    }

    return {
      success: true,
      total: filtered.length,
      data: filtered,
      foldersDeleted: true,
      APILimit: lastDeleteAPILimit,
    };
  } catch (err) {
    let errorObj;
    try {
      errorObj = JSON.parse(err.message);
    } catch (_) {
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
