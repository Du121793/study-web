/**
 * @file VimeoMethods.js
 * @description Vimeo 影片管理工具，提供影片上傳、查詢、刪除等功能
 */
const { logError } = require('../../utils/logger');
require('dotenv').config();
const config = require('../../config/vimeoConfig.json');
const VideoInfo = require('../../models').courseVideoInfo;
const {
  initCache,
  getFolderPath,
  removeFolderCache,
  checkedVimeoRequest,
} = require('./vimeoPathV2controller');

// 啟動時載入並排程快取
initCache().catch(err => logError({}, 'VimeoMethods.js', 'initCache', {}, err));

/**
 * 合併描述與 metadata
 */
function buildDescription(originalDesc = '', data = {}) {
  let desc = originalDesc;
  for (const [key, value] of Object.entries(data)) {
    if (value) desc += `\n[${key.toUpperCase()}]=${value}`;
  }
  return desc;
}

/**
 * 上傳影片到 Vimeo（無變動）
 */
async function uploadVideo(videoInfo, videoIndex) {
  const { title, fileSize, description = '' } = videoInfo;
  try {
    if (!fileSize || isNaN(fileSize)) throw new Error('fileSize 錯誤');
    const { userId, folderId } = await getFolderPath(videoIndex, true);
    const finalDesc = buildDescription(description, videoIndex);

    const queryOptions = {
      upload: { approach: 'tus', size: fileSize },
      name: title,
      description: finalDesc,
      embed: {
        buttons: { like: false, watchlater: false, share: false, embed: false },
        logos:   { vimeo: false },
        title:   { name: 'hide', owner: 'hide', portrait: 'hide' },
      },
    };
    if (config.videoPrivacy === 'privacy') {
      queryOptions.privacy = { view: 'disable', embed: 'public' };
    }

    const createResp = await checkedVimeoRequest({
      method: 'POST',
      path: '/me/videos',
      headers: { 'Content-Type': 'application/json' },
      query: queryOptions,
    });
    if (!createResp.data.upload?.upload_link) {
      throw new Error('Vimeo 回傳無 upload_link');
    }
    const videoId = createResp.data.uri.split('/').pop();

    const addFolder = await checkedVimeoRequest({
      method: 'PUT',
      path: `/users/${userId}/projects/${folderId}/videos/${videoId}`,
    });

    return {
      success: true,
      vimeoUri:   createResp.data.uri,
      videoId:    videoIndex.videoID,
      uploadLink: createResp.data.upload.upload_link,
      APILimit:   addFolder.APILimit,
    };
  } catch (err) {
    try { await deleteVideo({ videoID: videoIndex.videoID }); } catch (e) {}
    removeFolderCache(videoIndex);
    await VideoInfo.findOneAndDelete({ _id: videoIndex.videoID });
    logError({}, 'VimeoMethods.js', 'uploadVideo', { videoIndex }, err);
    return {
      success: false,
      msg:     'Vimeo API 錯誤：' + err.message,
      error:   err.message,
    };
  }
}

/**
 * 查找影片（無變動）
 */
async function findVideo(videoIndex = {}) {
  try {
    if (!Object.values(videoIndex).some(Boolean)) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    const { userId, folderId } = await getFolderPath(videoIndex, false);

    // 分頁取影片
    let page = 1, perPage = 100, all = [], lastLimit = {};
    while (true) {
      const resp = await checkedVimeoRequest({
        method: 'GET',
        path: `/users/${userId}/projects/${folderId}/videos`,
        query: { per_page: perPage, page, sort: 'date', direction: 'desc' },
      });
      lastLimit = resp.APILimit;
      all.push(...resp.data.data);
      if (resp.data.data.length < perPage) break;
      page++;
    }

    // 描述過濾
    const filtered = all.filter(video =>
      Object.entries(videoIndex).every(([k, v]) => {
        if (!v) return true;
        return (video.description || '').includes(`[${k.toUpperCase()}]=${v}`);
      })
    );

    return {
      success: true,
      total:   filtered.length,
      data:    filtered,
      APILimit: lastLimit,
    };
  } catch (err) {
    logError({}, 'VimeoMethods.js', 'findVideo', { videoIndex }, err);
    return {
      success: false,
      message: '搜尋失敗：' + err.message,
      error:   err.message,
      APILimit: {},
    };
  }
}

/**
 * 刪除影片＋自動刪空資料夾
 */
async function deleteVideo(videoIndex = {}) {
  try {
    if (!Object.values(videoIndex).some(Boolean)) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    // 取得資料夾與 URI
    const { userId, folderId, uri } = await getFolderPath(videoIndex, false);

    // 1. 分頁取目前所有影片
    let page = 1, perPage = 100, all = [], lastLimit = {};
    while (true) {
      const resp = await checkedVimeoRequest({
        method: 'GET',
        path: `/users/${userId}/projects/${folderId}/videos`,
        query: { per_page: perPage, page, sort: 'date', direction: 'desc' },
      });
      lastLimit = resp.APILimit;
      all.push(...resp.data.data);
      if (resp.data.data.length < perPage) break;
      page++;
    }

    // 2. 篩選要刪除的影片
    const toDel = all.filter(video =>
      Object.entries(videoIndex).every(([k, v]) => {
        if (!v) return true;
        return (video.description || '').includes(`[${k.toUpperCase()}]=${v}`);
      })
    );

    // 3. 實際刪除
    let lastDelLimit = lastLimit;
    for (const vid of toDel) {
      const r = await checkedVimeoRequest({ method: 'DELETE', path: vid.uri });
      lastDelLimit = r.APILimit;
    }

    // 4. 若刪除數等於原影片數，代表資料夾已空
    if (all.length > 0 && toDel.length === all.length) {
      // 刪除空資料夾
      await checkedVimeoRequest({ method: 'DELETE', path: uri });
      // 移除本地快取
      removeFolderCache(videoIndex);
    }

    return {
      success: true,
      total:    toDel.length,
      data:     toDel,
      APILimit: lastDelLimit,
    };
  } catch (err) {
    logError({}, 'VimeoMethods.js', 'deleteVideo', { videoIndex }, err);
    return {
      success: false,
      message: '刪除失敗：' + err.message,
      error:   err.message,
      APILimit: {},
    };
  }
}

module.exports = {
  upload: uploadVideo,
  find:   findVideo,
  delete: deleteVideo,
};
