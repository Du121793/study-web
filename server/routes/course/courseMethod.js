const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const VideoAccess = require("../../models").courseVideoAccess;
const VimeoMethods = require("../../methods").vimeoMethods;
const vimeoSchedule = require("../../models").vimeoSchedule;
const imageCompresser = require("../../methods/imageCompresser");
const accessChecker = require("../routesMiddleware/accessChecker");
const videoAccessRoute = require("./videoAccess");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

router.use("/videoAccess", accessChecker.teacher, videoAccessRoute);

// 改用 memoryStorage，接收到的檔案將保留在 req.file.buffer 中
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 處理上傳的 thumbnail 圖片，直接使用 fs 寫入檔案
 * 檔案最終存放在 resource/videoIMG/ 目錄下，檔名為 videoId + 原始副檔名
 * @param {Object} file - 透過 multer 處理後的單一檔案
 * @param {string|ObjectId} videoId - 影片的 _id
 * @returns {Promise<string>} - 回傳寫入檔案的路徑
 */
async function processThumbnailImage(file, videoId) {
  return new Promise((resolve, reject) => {
    const fileExt = path.extname(file.originalname);
    const newFilename = videoId + fileExt;
    // 最終檔案存放在 resource/videoIMG/ 下（與文件1原本的存放規則相同）
    const newPath = path.join("resource/videoIMG/", newFilename);

    // 若有需要可在此加入圖片壓縮的邏輯，類似文件2 的 compressImageBuffer

    // 直接寫入 buffer 到指定路徑
    fs.writeFile(newPath, file.buffer, (err) => {
      if (err) {
        console.error("寫入圖片檔案錯誤:", err);
        return reject(err);
      }
      resolve(newPath);
    });
  });
}

router.get("/members", async (req, res) => {
  try {
    // 取得查詢參數
    const { role } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy; // 可選 "grade" 或 "date"
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    // 取得課程成員，假設 req.course.members 為已填充的成員陣列
    let members = req.course.members || [];

    // 過濾：若指定角色，則僅回傳該角色成員
    if (role) {
      members = members.filter((member) => member.role === role);
    }

    // 排序：依據 sortBy 參數排序
    if (sortBy === "grade") {
      members.sort((a, b) => {
        // 取得年級，若不存在則視為 null
        const gradeA = a.userinfo && a.userinfo.grade ? a.userinfo.grade : null;
        const gradeB = b.userinfo && b.userinfo.grade ? b.userinfo.grade : null;
        // 假設 grade 為數值型態或數值字串，若非數值可用字串比較
        const numA = gradeA !== null ? parseInt(gradeA, 10) : null;
        const numB = gradeB !== null ? parseInt(gradeB, 10) : null;

        // 排序規則：
        // - 若兩者皆有年級，則依據數值大小比較
        // - 若一方沒有年級，則該成員排在後面
        if (numA === null && numB === null) {
          // 都沒有年級，則以 date 排序
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } else if (numA === null) {
          return 1;
        } else if (numB === null) {
          return -1;
        } else if (numA !== numB) {
          return sortOrder === "asc" ? numA - numB : numB - numA;
        } else {
          // 若年級相同，則以 date 排序
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
      });
    } else if (sortBy === "date") {
      members.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    // 若未指定 sortBy，則保留原有順序

    // 分頁：依據 page 與 pageSize 計算起始與結束索引
    const total = members.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedMembers = members.slice(startIndex, startIndex + pageSize);

    return res.json({
      success: true,
      data: paginatedMembers,
      page,
      pageSize,
      total,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
    });
  }
});

router.get("/videoInfo", async (req, res) => {
  try {
    // 從 query 中解析參數，注意 pageSize 不再給預設值
    let { type, page = 1, sortBy, sortOrder, noImg } = req.query;
    let pageSize = req.query.pageSize;

    // type 為必填
    if (!type) {
      return res.status(400).json({ success: false, msg: "type is required" });
    }

    // 建立查詢條件 (必須同時符合 courseID 和 type)
    const filter = {
      courseID: req.course._id,
      type: type,
      isUploadSuccess: true,
    };

    // 設定可排序的欄位: 新增 date
    const allowedSortFields = ["length", "recordDate", "date"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";

    // 排序方向：預設 asc，若傳 'desc' 則 -1
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sortOptions = { [sortField]: sortDirection };

    // 預設只回傳這些欄位 (mongoose 會預設包含 _id)
    let fields = "title description thumbnail length recordDate date isPrivate";
    // 若傳入 noImg，則不回傳 thumbnail
    if (noImg == true) {
      fields = "title description length recordDate date isPrivate";
    }

    // 建立查詢，並依據條件、選取欄位與排序
    let query = VideoInfo.find(filter).select(fields).sort(sortOptions);
    // 若有傳入 pageSize，則進行分頁，否則回傳所有符合條件的資料
    if (typeof pageSize !== "undefined") {
      const pageSizeNum = parseInt(pageSize);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * pageSizeNum;
      query = query.skip(skip).limit(pageSizeNum);
    }

    let foundVideoInfo = await query;
    foundVideoInfo = await Promise.all(
      foundVideoInfo.map(async (item) => {
        // 將 Mongoose document 轉成純物件
        let plainItem = item.toObject();
        let hasAccess = true;
        let accessRecord = null;
        if (plainItem.isPrivate) {
          const records = await VideoAccess.aggregate([
            {
              $match: {
                courseID: req.course._id,
                videoIDs: { $in: [plainItem._id] },
                studentIDs: { $in: [req.user._id] },
              },
            },
            {
              // 若 accessDate 為 null 或不存在，則用一個極大的日期（表示「無限期」）代替
              $addFields: {
                effectiveAccessDate: {
                  $ifNull: ["$accessDate", new Date(8640000000000000)],
                },
              },
            },
            {
              $sort: { effectiveAccessDate: -1 },
            },
            {
              $limit: 1,
            },
          ]);

          accessRecord = records[0] || null;

          hasAccess = !!accessRecord;
        }
        plainItem.access = {};
        plainItem.access.isAccess = hasAccess;
        plainItem.access.accessDate = accessRecord
          ? accessRecord.accessDate
          : null;

        if (plainItem.thumbnail) {
          plainItem.thumbnail =
            `${process.env.SERVER_IP}/` + plainItem.thumbnail;
        }
        return plainItem;
      })
    );
    return res.json({ success: true, data: foundVideoInfo });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "很抱歉，伺服器目前無法處理您的要求" });
  }
});

router.get("/videoUri", async (req, res) => {
  try {
    // 1. 從 query 取得 videoId（對應到資料庫中的 _id）
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ success: false, msg: "videoId 必須提供" });
    }

    // 2. 先從資料庫中確認是否存在該筆 VideoInfo 與是否擁有觀看權限
    const foundVideo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideo) {
      return res.status(404).json({ success: false, msg: "找不到該影片資料" });
    }

    if (foundVideo.isPrivate) {
      const access = !!(await VideoAccess.findOne({
        courseID: req.course._id,
        videoIDs, // 依需求這邊也可以改成其他查詢條件
        studentIDs: { $in: [req.user._id] },
      }));
      if (!access) {
        return res
          .status(401)
          .json({ success: false, msg: "你沒有觀看此影片的權限" });
      }
    }

    const result = {
      success: true,
      embedLink: foundVideo.videoURL, // 若需要前端用 iframe embed
    };

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求",
      error: err,
    });
  }
});

router.post(
  "/uploadVideo",
  [accessChecker.teacher, upload.single("thumbnail")],
  // 使用 upload.single('thumbnail') 代表只處理單一檔案，且該欄位名稱為 thumbnail
  
  async (req, res) => {
    try {
      // 由 formData 取得文字欄位
      const {
        title,
        fileSize,
        description,
        type,
        length,
        recordDate,
        isPrivate,
      } = req.body;

      console.log(req.body)
      
      // 檢查必要欄位
      if (!title || !fileSize)
        return res.status(400).json({ success: false, msg: "上傳資料缺少" });

      // 由於 formData 傳送的布林值為字串，需轉換
      let isPrivateBool = false;
      if (isPrivate !== undefined) {
        if (isPrivate === "true") {
          isPrivateBool = true;
        } else if (isPrivate === "false") {
          isPrivateBool = false;
        } else {
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate必須是布林值" });
        }
      }

      const { subject, grade, courseClass } = req.course;

      // 建立新影片資料，不先加入 thumbnail 欄位
      const newVideoInfoParams = recordDate
        ? {
            title,
            courseID: req.course._id,
            type,
            description: description || "",
            length: length || 0,
            isPrivate: isPrivateBool,
            recordDate,
          }
        : {
            title,
            courseID: req.course._id,
            type,
            description: description || "",
            isPrivate: isPrivateBool,
            length: length || 0,
          };

      const newVideoInfo = new VideoInfo(newVideoInfoParams);
      const savedVideoInfo = await newVideoInfo.save();

      // 若有上傳 thumbnail，則呼叫獨立的函式進行檔案處理
      if (req.file) {
        const thumbnailPath = await processThumbnailImage(
          req.file,
          savedVideoInfo._id
        );
        savedVideoInfo.thumbnail = thumbnailPath;
        await savedVideoInfo.save();
      }

      // 準備影片上傳所需的 videoIndex 物件
      let videoIndex = {
        videoID: savedVideoInfo._id,
        courseID: req.course._id,
        subject,
        grade,
        courseClass,
      };

      // 呼叫 VimeoMethods.upload 進行影片上傳
      const uploadUri = await VimeoMethods.upload(req.body, videoIndex);
      if (!uploadUri.success)
        return res.status(500).json({
          success: false,
          msg: "目前請求繁忙請稍等一分鐘後再進行請求",
        });

      return res.json({ success: true, data: uploadUri });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
    }
  }
);

router.patch("/uploadVideoStatus", accessChecker.teacher, async (req, res) => {
  try {
    const { isUploadSuccess, videoId } = req.body;
    if (typeof isUploadSuccess !== "boolean" || !videoId)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

    let foundItem = await VideoInfo.findById(videoId);

    if (!foundItem)
      return res
        .status(400)
        .json({ success: false, msg: "伺服器無法找到此資源" });

    if (!isUploadSuccess) {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { videoId: videoId },
      });
      newSchedule.save();
      await VideoInfo.findByIdAndDelete(videoId);
      return res.json({ success: true, msg: "已將此資源刪除" });
    }

    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({ videoId });

    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
    } else {
      const newSchedule = new vimeoSchedule({
        method: "get",
        videoIndex: { videoId: videoId },
        takeTo: {
          schema: "VideoInfo",
          id: foundItem._id,
          key: "videoURL",
        },
      });
      newSchedule.save();
      return res.json({
        success: true,
        msg: "已收到您的回傳結果，15分鐘後若無看到影片表示上傳失敗",
      });
    }
    await foundItem.save();
    return res.json({ success: true, msg: "已收到您的回傳結果，影片已就緒" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

/* 
payload={
  videoID = videoID
  thumbnail = null
  title = ''
  description = null
  isPrivate = true || false
}
 */
router.patch(
  "/patchVideo",
  accessChecker.teacher,
  upload.single("thumbnail"), // 處理 thumbnail 的檔案更新
  async (req, res) => {
    try {
      console.log(req.body)
      const { videoID } = req.body;
      if (!videoID)
        return res.status(400).json({ success: false, msg: "缺少 videoID" });

      // 先取出資料庫中的原始影片資料，方便檢查舊的 thumbnail 是否存在
      const video = await VideoInfo.findById(videoID);
      if (!video)
        return res.status(404).json({ success: false, msg: "找不到該影片" });

      // 只允許更新 title、description、isPrivate 與 thumbnail
      const updateFields = {};

      // 處理 title：若有傳送，必須是字串且不能為 null
      if (req.body.hasOwnProperty("title")) {
        const title = req.body.title;
        if (title === null || title === "null")
          return res
            .status(400)
            .json({ success: false, msg: "title 不能傳入 null" });
        if (typeof title !== "string")
          return res
            .status(400)
            .json({ success: false, msg: "title 必須是字串" });
        updateFields.title = title;
      }

      // 處理 description：若傳入 null 則轉成空字串；型別必須為字串
      if (req.body.hasOwnProperty("description")) {
        let description = req.body.description;
        if (description === null || description === "null") {
          description = "";
        }
        if (typeof description !== "string")
          return res
            .status(400)
            .json({ success: false, msg: "description 必須是字串" });
        updateFields.description = description;
      }

      // 處理 isPrivate：若有傳送，不能為 null，且僅接受 "true" 或 "false" 字串
      if (req.body.hasOwnProperty("isPrivate")) {
        const isPrivate = req.body.isPrivate;
        if (isPrivate === null || isPrivate === "null")
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate 不能傳入 null" });
        let isPrivateBool;
        if (isPrivate === true) {
          isPrivateBool = true;
        } else if (isPrivate === false) {
          isPrivateBool = false;
        } else {
          return res
            .status(400)
            .json({ success: false, msg: "isPrivate 必須是布林值" });
        }
        updateFields.isPrivate = isPrivateBool;
      }

      // 處理 thumbnail：若有上傳新的檔案，先刪除舊圖片，再重新命名上傳的檔案
      if (req.file) {
        // 若原本有舊的圖片，且檔案存在，先刪除掉
        if (video.thumbnail && fs.existsSync(video.thumbnail)) {
          fs.unlinkSync(video.thumbnail);
        }
        const fileExt = path.extname(req.file.originalname);
        // 新的檔案命名格式： resource/videoIMG/<courseID>/<videoID><副檔名>
        const newPath = path.join(
          `resource/videoIMG/${req.course._id}`,
          `${videoID}${fileExt}`
        );

        fs.renameSync(req.file.path, newPath);
        updateFields.thumbnail = newPath;
      }

      // 執行資料庫更新（忽略不允許更新的欄位）
      const updatedVideo = await VideoInfo.findByIdAndUpdate(
        videoID,
        updateFields,
        { new: true }
      );
      if (!updatedVideo)
        return res.status(404).json({ success: false, msg: "找不到該影片" });

      return res.json({ success: true, data: updatedVideo });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, msg: "伺服器錯誤" });
    }
  }
);

router.delete("/deleteVideo", accessChecker.teacher, async (req, res) => {
  try {
    const { videoId } = req.body;
    console.log("video", videoId);

    // 取得影片資料
    let foundVideoInfo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideoInfo)
      return res.status(400).json({ success: false, msg: "找不到影片資料" });

    // 若影片已有 thumbnail，且檔案存在，則刪除該圖片檔案
    if (foundVideoInfo.thumbnail && fs.existsSync(foundVideoInfo.thumbnail)) {
      fs.unlinkSync(foundVideoInfo.thumbnail);
    }

    const newSchedule = new vimeoSchedule({
      method: "delete",
      videoIndex: { videoId: videoId },
    });
    await newSchedule.save();

    await VideoInfo.findOneAndDelete({ _id: videoId });

    return res.json({ success: true, msg: "已更新資料庫" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: "伺服器處理失敗" });
  }
});
module.exports = router;
