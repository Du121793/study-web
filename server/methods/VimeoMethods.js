require("dotenv").config();
const { Vimeo } = require("@vimeo/vimeo");
const VideoInfo = require("../models/").courseVideoInfo;
const imageCompresser = require("./imageCompresser");

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
function buildDescription(
  originalDesc,
  videoID,
  courseID,
  grade,
  subject,
  courseClass
) {
  let desc = originalDesc || "";
  if (videoID) desc += `\n[VIDEOID]=${videoID}`;
  if (courseID) desc += `\n[COURSEID]=${courseID}`;
  if (grade) desc += `\n[GRADE]=${grade}`;
  if (subject) desc += `\n[SUBJECT]=${subject}`;
  if (courseClass) desc += `\n[CLASS]=${courseClass}`;
  return desc;
}

async function uploadVideo(reqBody, courseInfo) {
  const { subject, grade, courseClass } = courseInfo;
  const { title, fileSize, description, type, thumbnail, length, recordDate } =
    reqBody;

  const returnImg = await imageCompresser.compressBase64Image(thumbnail);

  const newVideoInfoParams = recordDate? {
    title,
    courseID: courseInfo._id,
    type,
    description: description || "",
    thumbnail: returnImg || "",
    length: length || 0,
    recordDate,
  } : {
    title,
    courseID: courseInfo._id,
    type,
    description: description || "",
    thumbnail: returnImg || "",
    length: length || 0,
  }

  const newVideoInfo = new VideoInfo(newVideoInfoParams);
  const savedVideoInfo = await newVideoInfo.save();

  try {
    console.log(fileSize);
    if (!fileSize || isNaN(fileSize)) {
      throw { success: false, message: "fileSize錯誤" };
    }

    // 1) 找到 WebVideos 資料夾
    const { userId, folderId } = await findOrCreateWebVideosFolder();

    // 2) 合併描述
    const finalDesc = buildDescription(
      description,
      savedVideoInfo._id,
      courseInfo._id,
      grade,
      subject,
      courseClass
    );

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
      videoId: savedVideoInfo._id,
      uploadLink: createResp.upload.upload_link,
    };
  } catch (err) {
    (async () => {
      await deleteVideo(savedVideoInfo._id);
      await VideoInfo.findOneAndDelete({ _id: savedVideoInfo._id });
    })();
    return {
      success: false,
      message: "Vimeo API 錯誤",
      error: err,
    };
  }
}

async function findVideo(
  videoID = "",
  courseID = "",
  grade = "",
  subject = "",
  courseClass = ""
) {
  try {
    // 如果全都沒帶，就回空
    if (!videoID && !courseID && !grade && !subject && !courseClass) {
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

      // 否則翻到下一頁
      page++;
    }

    // 3) 做"絕對搜尋"：在 description 中尋找
    function matchDescription(videoDesc, vid, cid, g, s, c) {
      if (vid && !videoDesc.includes(`[VIDEOID]=${vid}`)) return false;
      if (cid && !videoDesc.includes(`[COURSEID]=${cid}`)) return false;
      if (g && !videoDesc.includes(`[GRADE]=${g}`)) return false;
      if (s && !videoDesc.includes(`[SUBJECT]=${s}`)) return false;
      if (c && !videoDesc.includes(`[CLASS]=${c}`)) return false;
      return true;
    }

    const filtered = allVideos.filter((video) =>
      matchDescription(
        video.description || "",
        videoID,
        courseID,
        grade,
        subject,
        courseClass
      )
    );

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
async function deleteVideo(
  videoID = "",
  courseID = "",
  grade = "",
  subject = "",
  courseClass = ""
) {
  try {
    // 如果全都沒帶，就回空
    if (!videoID && !courseID && !grade && !subject && !courseClass) {
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

      // 否則翻到下一頁
      page++;
    }

    // 3) 做"絕對搜尋"：在 description 中尋找
    function matchDescription(videoDesc, vid, cid, g, s, c) {
      if (vid && !videoDesc.includes(`[VIDEOID]=${vid}`)) return false;
      if (cid && !videoDesc.includes(`[COURSEID]=${cid}`)) return false;
      if (g && !videoDesc.includes(`[GRADE]=${g}`)) return false;
      if (s && !videoDesc.includes(`[SUBJECT]=${s}`)) return false;
      if (c && !videoDesc.includes(`[CLASS]=${c}`)) return false;
      return true;
    }

    const filtered = allVideos.filter((video) =>
      matchDescription(
        video.description || "",
        videoID,
        courseID,
        grade,
        subject,
        courseClass
      )
    );

    // 4) 依序刪除符合條件的影片
    //    (可改成 Promise.all 並行刪除，但要注意 API 配額/風險)
    for (const vid of filtered) {
      // vid.uri 形如 "/videos/123456789"
      await vimeoRequest({
        method: "DELETE",
        path: vid.uri,
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
