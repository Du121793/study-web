const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const VideoAccess = require("../../models").courseVideoAccess;
const VimeoMethods = require("../../methods").vimeoMethods;
const vimeoSchedule = require("../../models").vimeoSchedule;
const imageCompresser = require("../../methods/imageCompresser");
const accessChecker = require("../routesMiddleware/accessChecker");
const videoAccessRoute = require("./videoAccess");

router.use("/videoAccess", accessChecker.teacher, videoAccessRoute);

/**
 * GET /members
 *
 * 說明：
 * 此路由用於取得課程成員資料，支援以下參數以進行過濾、排序與分頁：
 *
 * 查詢參數：
 * - role: 指定角色，僅回傳該角色的成員資料（例如 "student", "teacher", "admin"），
 *         若未指定則回傳所有成員。
 *
 * 分頁與排序參數：
 * - page (預設: 1): 當前頁碼。
 * - pageSize (預設: 10): 每頁回傳的成員數量。
 * - sortBy (可選): 排序依據，可選 "grade" 或 "date"，
 *       * "grade": 根據用戶的年級 (userinfo.grade) 排序；由於教師通常沒有年級，
 *                  因此沒有年級的成員會排在最後；若年級相同，則以建立時間 (date) 作次排序。
 *       * "date": 根據用戶建立時間 (date) 排序。
 *       若未指定 sortBy，則使用資料庫原有順序。
 * - sortOrder (預設: "asc"): 排序方向，"asc" 為升冪，"desc" 為降冪。
 *
 * 範例：
 * GET /members?role=student&page=2&pageSize=5&sortBy=grade&sortOrder=desc
 */

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

router.post("/uploadVideo", accessChecker.teacher, async (req, res) => {
  try {
    const {
      title,
      fileSize,
      description,
      type,
      thumbnail,
      length,
      recordDate,
      isPrivate = false,
    } = req.body;

    if (!title || !fileSize)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

    if (isPrivate != undefined && typeof isPrivate !== "boolean") {
      return res
        .status(400)
        .json({ success: false, msg: "isPrivate必須是布林值" });
    }

    const { subject, grade, courseClass } = req.course;

    const returnImg = await imageCompresser.compressBase64Image(thumbnail);
    const newVideoInfoParams = recordDate
      ? {
          title,
          courseID: req.course._id,
          type,
          description: description || "",
          thumbnail: returnImg || "",
          length: length || 0,
          isPrivate,
          recordDate,
        }
      : {
          title,
          courseID: req.course._id,
          type,
          description: description || "",
          thumbnail: returnImg || "",
          isPrivate,
          length: length || 0,
        };
    const newVideoInfo = new VideoInfo(newVideoInfoParams);
    const savedVideoInfo = await newVideoInfo.save();

    let videoIndex = {
      videoID: savedVideoInfo._id,
      courseID: req.course._id,
      subject,
      grade,
      courseClass,
    };
    // reqBody必須包含{ title, fileSize, description, type }
    const uploadUri = await VimeoMethods.upload(req.body, videoIndex);
    if (!uploadUri.success)
      return res
        .status(500)
        .json({ success: false, msg: "目前請求繁忙請稍等一分鐘後再進行請求" });
    return res.json({ success: true, data: uploadUri });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

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

    foundVideo.success = false;
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

router.delete("/deleteVideo", accessChecker.teacher, async (req, res) => {
  try {
    const { videoId } = req.body;
    console.log("video", videoId);
    let foundVideoInfo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideoInfo)
      return res.status(400).json({ success: false, msg: "找不到影片資料" });
    const newSchedule = new vimeoSchedule({
      method: "delete",
      videoIndex: { videoId: videoId },
    });
    await newSchedule.save();
    await VideoInfo.findOneAndDelete({ _id: videoId });
    return res.json({ success: true, msg: "已更新資料庫" });
  } catch (e) {
    return res.status(500).json({ success: false, msg: "伺服器處理失敗" });
  }
});

module.exports = router;
