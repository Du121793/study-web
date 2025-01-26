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
function buildDescription(originalDesc, courseID, grade, subject, courseClass) {
  let desc = originalDesc || "";
  if (courseID) desc += `\n[courseID]=${courseID}`;
  if (grade) desc += `\n[GRADE]=${grade}`;
  if (subject) desc += `\n[SUBJECT]=${subject}`;
  if (courseClass) desc += `\n[CLASS]=${courseClass}`;
  return desc;
}

async function uploadVideo(reqBody, courseInfo) {
  const { subject, grade, courseClass } = courseInfo;
  const { title, fileSize, description, type, thumbnail, length } = reqBody;

  const newVideoInfo = new VideoInfo({
    title,
    coureseID: courseInfo._id,
    type,
    description: description || "",
    thumbnail: thumbnail || "",
    length: length || 0,
  });

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
      await VideoInfo.findOneAndDelete({ _id: savedVideoInfo._id });
    })();
    return {
      success: false,
      message: "Vimeo API 錯誤",
      error: err,
    };
  }
}

module.exports.upload = uploadVideo;
// app.get("/api/find-videos", async (req, res) => {
//   try {
//     const { grade, subject, courseClass } = req.query;

//     // 如果全都沒帶，就回空
//     if (!grade && !subject && !courseClass) {
//       return res.json({ success: true, total: 0, data: [] });
//     }

//     // 1) 找到/建立 WebVideos 資料夾
//     const me = await vimeoRequest({ method: "GET", path: "/me" });
//     const userId = me.uri.split("/").pop();

//     // 查找 "WebVideos" folder
//     let folderResp = await vimeoRequest({
//       method: "GET",
//       path: "/me/projects",
//       query: { per_page: 50, query: "WebVideos" },
//     });
//     let folder = folderResp.data.find((p) => p.name === "WebVideos");
//     if (!folder) {
//       // 若找不到 WebVideos，表示尚未建立 -> 直接回傳空
//       return res.json({ success: true, total: 0, data: [] });
//     }
//     const folderId = folder.uri.split("/").pop();

//     // 2) 抓取該資料夾內所有影片 (單頁)
//     //    * 若影片很多，可能需要做翻頁
//     const videosResp = await vimeoRequest({
//       method: "GET",
//       path: `/users/${userId}/projects/${folderId}/videos`,
//       query: {
//         per_page: 50, // 可自行提高, 如 100
//         sort: "date",
//         direction: "desc",
//       },
//     });

//     // 3) 做"絕對搜尋"：在 description 中尋找
//     //    [GRADE]=xxx, [SUBJECT]=xxx, [CLASS]=xxx
//     function matchDescription(videoDesc, g, s, c) {
//       if (g && !videoDesc.includes(`[GRADE]=${g}`)) return false;
//       if (s && !videoDesc.includes(`[SUBJECT]=${s}`)) return false;
//       if (c && !videoDesc.includes(`[CLASS]=${c}`)) return false;
//       return true;
//     }

//     const filtered = videosResp.data.filter((video) =>
//       matchDescription(video.description || "", grade, subject, courseClass)
//     );

//     res.json({
//       success: true,
//       total: filtered.length,
//       data: filtered,
//     });
//   } catch (err) {
//     console.error("Find videos error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "搜尋失敗",
//       error: String(err),
//     });
//   }
// });
