const router = require("express").Router();
const VideoInfo = require("../../models").courseVideoInfo;
const VimeoMethods = require("../../methods").vimeoMethods;

router.get("/members", async (req, res) => {
  try {
    return res.send(req.course.members);
  } catch (e) {
    return res.send(500).send("很抱歉，伺服器目前無法處理您的要求");
  }
});

router.get("/videoInfo", async (req, res) => {
  try {
    // 從 query 中解析參數
    let {
      type, // 需要的 type 值（必傳），例如 'MainClass'、'QA' 等
      page = 1, // 預設頁碼
      pageSize = 10, // 預設每頁筆數
      sortBy, // 排序欄位: 'length' 或 'recordDate'
      sortOrder, // 排序順序: 'asc' 或 'desc'
    } = req.query;

    // 若 type 未傳，直接回傳錯誤（type 為必填）
    if (!type) {
      return res.status(400).json({ msg: "type is required" });
    }

    // 建立查詢條件 (必須同時符合 courseID 和 type)
    const filter = {
      courseID: req.course._id,
      type: type,
    };

    // 分頁參數
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 決定要依據哪個欄位排序 (若沒傳或不符合預期，預設用 recordDate)
    const sortField =
      sortBy === "length" || sortBy === "recordDate" ? sortBy : "recordDate";

    // 排序方向：預設 asc，若傳 'desc' 則 -1
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sortOptions = { [sortField]: sortDirection };

    const foundVideoInfo = await VideoInfo.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return res.json({ foundVideoInfo });
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
      return res.status(400).json({ msg: "videoId is required" });
    }

    // 2. 先從資料庫中確認是否存在該筆 VideoInfo
    const foundVideo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideo) {
      return res.status(404).json({ msg: "找不到該影片資料" });
    }

    // 3. 呼叫 VimeoMethods.find，依照我們的慣例：
    //    我們在上傳時會將 [VIDEOID]={_id} 塞到 Vimeo description 中，
    //    所以只要把 videoId 傳給 VimeoMethods.find，應該就能找出該影片
    const vimeoSearch = await VimeoMethods.find(videoId);

    if (!vimeoSearch.success) {
      // 代表在呼叫 Vimeo API 過程中失敗
      return res
        .status(500)
        .json({ msg: "Vimeo 搜尋失敗", error: vimeoSearch.error });
    }

    // 如果 total = 0 表示 Vimeo 上沒有符合描述的影片
    if (vimeoSearch.total === 0) {
      return res.status(404).json({ msg: "Vimeo 上未找到對應的影片" });
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

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "很抱歉，伺服器目前無法處理您的要求",
      error: String(err),
    });
  }
});
router.post("/uploadVideo", async (req, res) => {
  try {
    const { title, fileSize } = req.body;
    if (!title || !fileSize) return res.status(400).send("上傳資料缺少");

    const uploadUri = await VimeoMethods.upload(req.body, req.course);
    if (!uploadUri.success) throw { uploadUri };
    console.log(uploadUri);
    return res.send(uploadUri);
  } catch (e) {
    console.log(e);
    return res.status(500).send("很抱歉，伺服器無法處理上傳");
  }
});

router.delete("/deleteVideo", async (req, res) => {
  try {
    const { videoId } = req.query;
    console.log(videoId);
    let foundVideoInfo = await VideoInfo.findOne({ _id: videoId });
    if (!foundVideoInfo) return res.status(400).send("找不到影片資料");
    await VideoInfo.findOneAndDelete({ _id: videoId });
    await VimeoMethods.delete(videoId);
    return res.send("已更新資料庫");
  } catch (e) {
    return res.status(500).send("伺服器處理失敗");
  }
});

module.exports = router;
