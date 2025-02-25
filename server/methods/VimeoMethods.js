require("dotenv").config();
const { Vimeo } = require("@vimeo/vimeo");
const VideoInfo = require("../models/").courseVideoInfo;

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
if (!VIMEO_ACCESS_TOKEN) {
  console.error("請在 .env 中設定 VIMEO_ACCESS_TOKEN");
  process.exit(1);
}

const client = new Vimeo("", "", VIMEO_ACCESS_TOKEN);

/** 小工具：用 Promise 包裝 client.request */
function vimeoRequest(options) {
  return new Promise((resolve, reject) => {
    client.request(options, (err, body, statusCode, headers) => {
      if (err) return reject(err);
      resolve(body);
    });
  });
}

/** 找/建 名為 "WebVideos" 的資料夾 */
async function findOrCreateWebVideosFolder() {
  const me = await vimeoRequest({ method: "GET", path: "/me" });
  const userId = me.uri.split("/").pop(); // "/users/123456" -> "123456"

  // 查詢 /me/projects 是否已有
  const searchResp = await vimeoRequest({
    method: "GET",
    path: "/me/projects",
    query: { per_page: 50, query: "WebVideos" },
  });
  let found = searchResp.data.find((p) => p.name === "WebVideos");
  if (!found) {
    // 沒有 -> 建立
    found = await vimeoRequest({
      method: "POST",
      path: "/me/projects",
      query: {
        name: "WebVideos",
      },
    });
  }
  const folderId = found.uri.split("/").pop();
  return { userId, folderId };
}

/** 把 meta 寫入 description */
function buildDescription(originalDesc, data) {
  let desc = originalDesc || "";

  // 走訪 data 物件的所有 key/value
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      // 統一轉成大寫的 key，並拼接到 desc
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
      throw { success: false, message: "fileSize錯誤" };
    }

    // 1) 找到 WebVideos 資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder();

    // 2) 合併描述
    const finalDesc = buildDescription(description, videoIndex);

    // 3) 透過 "query" 帶入上傳資料 (含 upload)
    //    讓套件自動幫我們 JSON.stringify(這些資料)
    const createResp = await vimeoRequest({
      method: "POST",
      path: "/me/videos",
      // 如果你想手動指定 Content-Type，也可加：
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

    // 確保回傳有 upload_link
    if (!createResp.upload || !createResp.upload.upload_link) {
      throw { success: false, message: "Vimeo 回傳無 upload_link" };
    }
    const videoId = createResp.uri.split("/").pop();

    // 4) 加入資料夾
    await vimeoRequest({
      method: "PUT",
      path: `/users/${userId}/projects/${folderId}/videos/${videoId}`,
    });

    return {
      success: true,
      vimeoUri: createResp.uri,
      videoId: videoIndex.videoID,
      uploadLink: createResp.upload.upload_link,
    };
  } catch (err) {
    (async () => {
      await deleteVideo({ videoID: videoIndex.videoID });
      if (type === "MainClass")
        await VideoInfo.findOneAndDelete({ _id: videoIndex.videoID });
    })();
    return {
      success: false,
      msg: "Vimeo API 錯誤",
      error: err,
    };
  }
}

async function findVideo(videoIndex = {}) {
  try {
    // 如果沒有任何有效條件 (所有值都是 falsy)，就直接回傳空
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [] };
    }
    console.log("as", videoIndex);
    // 1) 找到/建立 WebVideos 資料夾
    const me = await vimeoRequest({ method: "GET", path: "/me" });
    const userId = me.uri.split("/").pop();

    // 查找 "WebVideos" folder
    let folderResp = await vimeoRequest({
      method: "GET",
      path: "/me/projects",
      query: { per_page: 50, query: "WebVideos" },
    });
    let folder = folderResp.data.find((p) => p.name === "WebVideos");
    if (!folder) {
      // 若找不到 WebVideos，表示尚未建立 -> 直接回傳空
      return { success: true, total: 0, data: [] };
    }
    const folderId = folder.uri.split("/").pop();

    // 2) 分頁抓取該資料夾內所有影片，直到拿不到更多
    let allVideos = [];
    let page = 1;
    let perPage = 100;

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

      // 合併當前頁影片
      allVideos.push(...videosResp.data);

      // 若這次拿到的筆數 < perPage，就代表沒有更多頁了
      if (videosResp.data.length < perPage) {
        break;
      }
      page++;
    }

    // 3) 做"絕對搜尋"：自動根據傳入的 key-value 逐一比對 description
    function matchDescription(videoDesc, conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        // 若該 key 有值，才做比對；空字串等 falsy 值就跳過
        if (value) {
          // KEY 一律轉成大寫後比對，如 [VIDEOID]=xxx
          const upperKey = key.toUpperCase();
          console.log(`[${upperKey}]=${value}`)
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

    // 回傳結果
    return {
      success: true,
      total: filtered.length,
      data: filtered,
    };
  } catch (err) {
    console.error("Find videos error:", err);
    return {
      success: false,
      message: "搜尋失敗",
      error: String(err),
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
    // 如果沒有任何有效條件 (所有值都是 falsy)，就直接回傳空
    const hasAtLeastOneCondition = Object.values(videoIndex).some(Boolean);
    if (!hasAtLeastOneCondition) {
      return { success: true, total: 0, data: [] };
    }

    // 1) 找到/建立 WebVideos 資料夾
    const me = await vimeoRequest({ method: "GET", path: "/me" });
    const userId = me.uri.split("/").pop();

    // 查找 "WebVideos" folder
    let folderResp = await vimeoRequest({
      method: "GET",
      path: "/me/projects",
      query: { per_page: 50, query: "WebVideos" },
    });
    let folder = folderResp.data.find((p) => p.name === "WebVideos");
    if (!folder) {
      return { success: true, total: 0, data: [] };
    }
    const folderId = folder.uri.split("/").pop();

    // 2) 分頁抓取該資料夾內所有影片，直到拿不到更多
    let allVideos = [];
    let page = 1;
    let perPage = 100;

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

      allVideos.push(...videosResp.data);

      if (videosResp.data.length < perPage) {
        break;
      }
      page++;
    }

    // 3) 絕對搜尋
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

    // 4) 依序刪除符合條件的影片
    //    (可改成 Promise.all 併發，但要留意 API 流量限制)
    for (const vid of filtered) {
      await vimeoRequest({
        method: "DELETE",
        path: vid.uri, // 形如 "/videos/123456789"
      });
    }

    return {
      success: true,
      total: filtered.length,
      data: filtered, // 回傳被刪除的影片資訊
    };
  } catch (err) {
    console.error("Delete videos error:", err);
    return {
      success: false,
      message: "刪除失敗",
      error: String(err),
    };
  }
}

module.exports.delete = deleteVideo;
module.exports.find = findVideo;
module.exports.upload = uploadVideo;
