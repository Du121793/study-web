require("dotenv").config();
const { Vimeo } = require("@vimeo/vimeo");
const VideoInfo = require("../models/").courseVideoInfo;

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
if (!VIMEO_ACCESS_TOKEN) {
  console.error("請在 .env 中設定 VIMEO_ACCESS_TOKEN");
  process.exit(1);
}

const client = new Vimeo("", "", VIMEO_ACCESS_TOKEN);

/** 小工具：用 Promise 包裝 client.request，回傳 { data, APILimit } */
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

/** 找/建 名為 "WebVideos" 的資料夾 */
async function findOrCreateWebVideosFolder() {
  const meResp = await vimeoRequest({ method: "GET", path: "/me" });
  const me = meResp.data;
  const userId = me.uri.split("/").pop(); // "/users/123456" -> "123456"

  // 查詢 /me/projects 是否已有
  const searchResp = await vimeoRequest({
    method: "GET",
    path: "/me/projects",
    query: { per_page: 50, query: "WebVideos" },
  });
  let found = searchResp.data.data.find((p) => p.name === "WebVideos");
  if (!found) {
    // 沒有 -> 建立
    found = await vimeoRequest({
      method: "POST",
      path: "/me/projects",
      query: {
        name: "WebVideos",
      },
    });
    found = found.data;
  }
  const folderId = found.uri.split("/").pop();
  return { userId, folderId };
}

/** 把 meta 寫入 description */
function buildDescription(originalDesc, data) {
  let desc = originalDesc || "";
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      desc += `\n[${key.toUpperCase()}]=${value}`;
    }
  }
  return desc;
}

async function uploadVideo(videoInfo, videoIndex) {
  const { title, fileSize, description = "", type } = videoInfo;
  try {
    console.log(fileSize);
    if (!fileSize || isNaN(fileSize)) {
      throw new Error("fileSize錯誤");
    }
    // 1) 找到 WebVideos 資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder();
    // 2) 合併描述
    const finalDesc = buildDescription(description, videoIndex);
    // 3) 呼叫 POST /me/videos 上傳影片
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
          view: "nobody", // 私密
        },
      },
    });
    // 檢查是否有 upload_link
    if (!createResp.data.upload || !createResp.data.upload.upload_link) {
      throw new Error("Vimeo 回傳無 upload_link");
    }
    const videoId = createResp.data.uri.split("/").pop();
    // 4) 加入資料夾
    const addFolderResp = await vimeoRequest({
      method: "PUT",
      path: `/users/${userId}/projects/${folderId}/videos/${videoId}`,
    });
    // 最後回應中加入 APILimit (以最後一次 API 呼叫 addFolderResp 為準)
    return {
      success: true,
      vimeoUri: createResp.data.uri,
      videoId: videoIndex.videoID,
      uploadLink: createResp.data.upload.upload_link,
      APILimit: addFolderResp.APILimit,
    };
  } catch (err) {
    try {
      await deleteVideo({ videoID: videoIndex.videoID });
    } catch (delErr) {
      return {
        success: false,
        msg: "Vimeo API 錯誤",
        error: delErr.message,
      };
    }
    await VideoInfo.findOneAndDelete({ _id: videoIndex.videoID });
    return {
      success: false,
      msg: "Vimeo API 錯誤：" + err.message,
      error: err.message,
    };
  }
}

async function findVideo(videoIndex = {}) {
  try {
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    // 1) 找到/建立 WebVideos 資料夾
    const meResp = await vimeoRequest({ method: "GET", path: "/me" });
    const me = meResp.data;
    const userId = me.uri.split("/").pop();
    // 查找 "WebVideos" folder
    const folderResp = await vimeoRequest({
      method: "GET",
      path: "/me/projects",
      query: { per_page: 50, query: "WebVideos" },
    });
    let folder = folderResp.data.data.find((p) => p.name === "WebVideos");
    if (!folder) {
      return {
        success: true,
        total: 0,
        data: [],
        APILimit: folderResp.APILimit,
      };
    }
    const folderId = folder.uri.split("/").pop();
    // 2) 分頁抓取該資料夾內所有影片
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
    // 3) 篩選符合條件的影片 (比對 description)
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
    console.log(lastAPILimit);
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

/****
 * 說明：
 * 1. 與 findVideo 相同步驟搜尋、篩選影片。
 * 2. 搜尋到的影片，依序呼叫 DELETE 進行刪除。
 * 3. 刪除完成後，回傳成功刪除的筆數與被刪除的影片資訊。
 ****/
async function deleteVideo(videoIndex = {}) {
  try {
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [], APILimit: {} };
    }
    // 1) 找到/建立 WebVideos 資料夾
    const meResp = await vimeoRequest({ method: "GET", path: "/me" });
    const me = meResp.data;
    const userId = me.uri.split("/").pop();
    // 查找 "WebVideos" folder
    const folderResp = await vimeoRequest({
      method: "GET",
      path: "/me/projects",
      query: { per_page: 50, query: "WebVideos" },
    });
    let folder = folderResp.data.data.find((p) => p.name === "WebVideos");
    if (!folder) {
      return {
        success: true,
        total: 0,
        data: [],
        APILimit: folderResp.APILimit,
      };
    }
    const folderId = folder.uri.split("/").pop();
    // 2) 分頁抓取該資料夾內所有影片
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
    // 3) 根據描述篩選
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
    // 4) 依序刪除符合條件的影片
    let lastDeleteAPILimit = {};
    for (const vid of filtered) {
      const deleteResp = await vimeoRequest({
        method: "DELETE",
        path: vid.uri,
      });
      lastDeleteAPILimit = deleteResp.APILimit;
    }
    return {
      success: true,
      total: filtered.length,
      data: filtered,
      APILimit: lastDeleteAPILimit,
    };
  } catch (err) {
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
