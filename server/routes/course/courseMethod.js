const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const QAmessage = require("../../models").QAmessage;
const VimeoMethods = require("../../methods").vimeoMethods;
const imageCompresser = require("../../methods/imageCompresser");
const accessChecker = require("../routesMiddleware/accessChecker");

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
    // 取得查詢參數（全部採絕對比對）
    const { role, username, realname, phoneNumber, _id } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy; // 可選 "grade" 或 "date"
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    // 確認 req.course.members 存在且為陣列（這裡假設該陣列存放的是用戶 ID）
    if (!req.course || !Array.isArray(req.course.members)) {
      return res.status(400).json({
        success: false,
        msg: "課程成員資料不存在或格式錯誤"
      });
    }

    // 建立過濾條件，必須限制 _id 在 req.course.members 內
    let filter = {};
    if (_id) {
      // 若同時提供 _id，則同時限制必須為指定 _id 與屬於該課程
      filter.$and = [{ _id: { $in: req.course.members } }, { _id }];
    } else {
      filter._id = { $in: req.course.members };
    }
    if (username) {
      filter["userinfo.username"] = username;
    }
    if (realname) {
      filter["userinfo.realname"] = realname;
    }
    if (phoneNumber) {
      filter["userinfo.phoneNumber"] = phoneNumber;
    }
    if (role) {
      filter.role = role;
    }

    // 建立排序條件
    let sortQuery = {};
    if (sortBy === "grade") {
      // 依據 userinfo.grade 及 date 排序
      sortQuery = {
        "userinfo.grade": sortOrder === "asc" ? 1 : -1,
        date: sortOrder === "asc" ? 1 : -1
      };
    } else if (sortBy === "date") {
      sortQuery = { date: sortOrder === "asc" ? 1 : -1 };
    }
    // 未指定 sortBy 則維持預設排序

    // 先取得符合條件的記錄總數
    const total = await User.countDocuments(filter);
    const totalPage = Math.ceil(total / pageSize);

    // 查詢符合條件的會員詳細資料，加入分頁與排序
    const users = await User.find(filter)
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      success: true,
      data: users,
      page,
      pageSize,
      total,
      totalPage
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      msg: "很抱歉，伺服器目前無法處理您的要求"
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

    console.log(sortField);

    // 建立查詢，先依據條件及排序
    let query = VideoInfo.find(filter).sort(sortOptions);

    // 若傳入 noImg 參數，則不傳送縮圖 (假設縮圖欄位為 thumbnail)
    if (noImg == true) {
      query = query.select("-thumbnail");
    }

    // 若有傳入 pageSize，則進行分頁，否則回傳所有符合條件的資料
    if (typeof pageSize !== "undefined") {
      const pageSizeNum = parseInt(pageSize);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * pageSizeNum;
      query = query.skip(skip).limit(pageSizeNum);
    }

    const foundVideoInfo = await query;
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

    // 2. 先從資料庫中確認是否存在該筆 VideoInfo
    const foundVideo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideo) {
      return res.status(404).json({ success: false, msg: "找不到該影片資料" });
    }

    // 3. 呼叫 VimeoMethods.find，依照我們的慣例：
    //    我們在上傳時會將 [VIDEOID]={_id} 塞到 Vimeo description 中，
    //    所以只要把 videoId 傳給 VimeoMethods.find，應該就能找出該影片
    const vimeoSearch = await VimeoMethods.find({ videoId });

    if (!vimeoSearch.success) {
      // 代表在呼叫 Vimeo API 過程中失敗
      return res.status(500).json({
        success: false,
        msg: "Vimeo 搜尋失敗",
        error: vimeoSearch.error,
      });
    }

    // 如果 total = 0 表示 Vimeo 上沒有符合描述的影片
    if (vimeoSearch.total === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "Vimeo 上未找到對應的影片" });
    }

    // 4. 這裡假設只會有一支影片符合 [VIDEOID]，取第一筆即可
    const vimeoData = vimeoSearch.data[0];

    // Vimeo 的 response data 中常見欄位：
    // - uri: 形如 "/videos/123456789"
    // - link: 形如 "https://vimeo.com/123456789"
    // - player_embed_url: 形如 "https://player.vimeo.com/video/123456789"
    // 你可以依需求自訂回傳內容。
    const result = {
      success: true,
      title: vimeoData.name,
      description: vimeoData.description,
      link: vimeoData.link, // 直接觀看的連結
      uri: vimeoData.uri,
      embedLink: vimeoData.player_embed_url || "", // 若需要前端用 iframe embed
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
    } = req.body;

    if (!title || !fileSize)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

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
          recordDate,
        }
      : {
          title,
          courseID: req.course._id,
          type,
          description: description || "",
          thumbnail: returnImg || "",
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
    if (!uploadUri.success) throw { uploadUri };
    console.log(uploadUri);
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

    // if (isUploadSuccess) {
    //   await VideoInfo.findByIdAndUpdate(
    //     videoId,
    //     { $set: { isUploadSuccess: true } },
    //     { new: true }
    //   );
    // }

    foundItem.isUploadSuccess = true;

    await foundItem.save();

    return res.json({ success: true, msg: "已收到您的回傳結果" });
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
    await VimeoMethods.delete({ videoId });
    await VideoInfo.findOneAndDelete({ _id: videoId });
    return res.json({ success: true, msg: "已更新資料庫" });
  } catch (e) {
    return res.status(500).json({ success: false, msg: "伺服器處理失敗" });
  }
});

module.exports = router;
