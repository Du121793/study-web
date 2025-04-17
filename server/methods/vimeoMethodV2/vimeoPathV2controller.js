// vimeoPathV2controller.js
/**
 * @file vimeoPathV2controller.js
 * @description Vimeo 路徑快取 v2：讀寫快取檔、排程重整、提供取得／刪除方法
 */
const fs = require('fs');
const path = require('path');
const { vimeoRequest, getUserId } = require('./vimeoHelpers');
const config = require('../../config/vimeoConfig.json');

const CACHE_FILE = path.join(__dirname, './vimeoPathCacheV2.json');
let cache = { course: {}, question: {} };
let lastApiLimit = { remaining: Infinity, reset: 0 };

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
    catch { cache = { course: {}, question: {} }; }
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * 包裝 vimeoRequest，並在遇到 rate‑limit (error_code 9000) 時
 * 自動等待 60 秒後重試，確保後續 delete 資料夾的呼叫能跑到
 */
async function checkedVimeoRequest(options) {
  // 若上一次回傳剩餘額度小於等於 15，也先等到 reset 再動作
  if (lastApiLimit.remaining <= 15) {
    const now = Math.floor(Date.now() / 1000);
    const wait = lastApiLimit.reset - now + 2;
    if (wait > 0) await sleep(wait * 1000);
  }

  while (true) {
    try {
      const { data, APILimit } = await vimeoRequest(options);
      lastApiLimit = APILimit;
      return { data, APILimit };
    } catch (err) {
      // 嘗試解析 JSON 錯誤訊息
      let errObj = null;
      try { errObj = JSON.parse(err.message); } catch {}
      // 如果是 rate‑limit，sleep 60 秒後重試
      if (errObj && errObj.error_code === 9000) {
        await sleep(60 * 1000);
        continue;
      }
      // 其他錯誤則拋出
      throw err;
    }
  }
}

async function reloadCacheAll() {
  cache = { course: {}, question: {} };
  saveCache();

  let page = 1, perPage = 100, resp;
  do {
    resp = await checkedVimeoRequest({
      method: 'GET',
      path: '/me/projects',
      query: { per_page: perPage, page }
    });
    resp.data.data.forEach(folder => {
      const n = folder.name;
      if (n.startsWith('COURSE:')) {
        cache.course[n.split(':')[1]] = folder.uri;
      } else if (n.startsWith('QUESTION:')) {
        cache.question[n.split(':')[1]] = folder.uri;
      }
    });
    page++;
  } while (resp.data.data.length === perPage);

  saveCache();
}

async function initCache() {
  loadCache();
  await reloadCacheAll();
  const { cacheV2 } = config;
  if (cacheV2?.days && cacheV2.hour >= 0 && cacheV2.minute >= 0) {
    const interval = cacheV2.days * 24 * 60 * 60 * 1000;
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === cacheV2.hour && now.getMinutes() === cacheV2.minute) {
        await reloadCacheAll();
      }
    }, interval);
  }
}

/**
 * 取得或建立資料夾（分頁搜尋所有頁面，找不到才建立）
 */
async function getFolderPath(videoIndex, isUpload = false) {
  const idx = Object.entries(videoIndex).reduce((o,[k,v]) => {
    o[k.toUpperCase()] = v;
    return o;
  }, {});
  
  const qid = idx.QUESTIONID;
  const cid = idx.COURSEID;
  if (!qid && !cid) throw new Error('videoIndex 必須包含 QUESTIONID 或 COURSEID');
  const name = qid ? `QUESTION:${qid}` : `COURSE:${cid}`;

  // 先查快取
  let uri = qid ? cache.question[qid] : cache.course[cid];
  if (uri) {
    const parts = uri.split('/');
    return { userId: parts[2], folderId: parts[4], uri };
  }

  // 分頁搜尋所有 PROJECTS
  let page = 1, perPage = 100, resp;
  let found = null;
  do {
    resp = await checkedVimeoRequest({
      method: 'GET',
      path: '/me/projects',
      query: { per_page: perPage, page, query: name }
    });
    found = resp.data.data.find(p => p.name === name);
    page++;
  } while (!found && resp.data.data.length === perPage);

  if (found) {
    uri = found.uri;
    const parts = uri.split('/');
    if (qid) cache.question[qid] = uri;
    else    cache.course[cid]     = uri;
    saveCache();
    return { userId: parts[2], folderId: parts[4], uri };
  }

  // 上傳時才自動建立
  if (isUpload) {
    const cr = await checkedVimeoRequest({
      method: 'POST',
      path: '/me/projects',
      query: { name }
    });
    uri = cr.data.uri;
    const parts = uri.split('/');
    if (qid) cache.question[qid] = uri;
    else    cache.course[cid]     = uri;
    saveCache();
    return { userId: parts[2], folderId: parts[4], uri };
  }

  throw new Error(`未找到資料夾：${name}`);
}

function removeFolderCache(videoIndex) {
  // 將所有 key 轉大寫，值一樣
const idx = Object.entries(videoIndex).reduce((o,[k,v]) => {
  o[k.toUpperCase()] = v;
  return o;
}, {});

const qid = idx.QUESTIONID;
const cid = idx.COURSEID;
  if (qid) delete cache.question[qid];
  if (cid) delete cache.course[cid];
  saveCache();
}

module.exports = {
  initCache,
  getFolderPath,
  removeFolderCache,
  checkedVimeoRequest,
};
