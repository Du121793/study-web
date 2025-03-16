const router = require("express").Router();
const Course = require("../../../models").course;
const User = require("../../../models").user;
const QA = require("../../../models").QA;
const QAmessage = require("../../../models").QAmessage;
const imageCompresser = require("../../../methods/imageCompresser");
const { vimeoSchedule } = require("../../../models");
const videoInfoModel = require("../../../models/course/videoInfo-model");
const accessChecker = require("../../routesMiddleware/accessChecker");
const VimeoMethods = require("../../../methods").vimeoMethods;
const multer = require("multer");
const upload = multer();

router.get("/", async (req, res) => {
  try {
    return res.json({ success: true, data: req.question, msg: "" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.get("/getComment", async (req, res) => {
  try {
    // 依照 QAmessage 的 pointTo 查詢相關留言，並 populate poster 欄位
    const messages = await QAmessage.find({
      pointTo: req.question._id,
    }).populate("poster", "role userinfo.username userinfo.pictureUrl");

    // 將每筆留言轉換成物件，並根據 isPrivate 的狀況修改 poster 欄位內容
    const transformedMessages = messages.map((msg) => {
      // 先取得原 poster 資料（注意有可能 poster 為 null）
      let poster = msg.poster
        ? {
            role: msg.poster.role,
            username: msg.poster.userinfo ? msg.poster.userinfo.username : "",
            pictureUrl: msg.poster.userinfo
              ? msg.poster.userinfo.pictureUrl
              : "",
          }
        : null;

      // 當留言設定為私密時，將 poster 資料替換為預設值
      if (msg.isPrivate) {
        poster = {
          role: "匿名角色",
          username: "匿名",
          pictureUrl: "",
        };
      }
      // 回傳轉換後的留言物件（將 mongoose 文件轉換成純 JS 物件）
      return {
        ...msg.toObject(),
        poster: poster,
      };
    });

    return res.json({ success: true, data: transformedMessages });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "取得資源時發生錯誤" });
  }
});
router.post("/postNewComment", upload.none(), async (req, res) => {
  try {
    const {
      content,
      image = [],
      fileSize,
      isPrivate = false,
      isBest = false,
    } = req.body;
    console.log(req.body);
    if (!Array.isArray(image)) {
      return res.status(400).json({ success: false, msg: "image 必須是陣列" });
    }
    if (!(content || image.length !== 0 || fileSize)) {
      console.log(1);
      return res.status(400).json({
        success: false,
        msg: "資料提供不完整",
      });
    }

    if (isBest && req.user.role === "student") {
      {
        console.log(2);
        return res.status(400).json({ success: false, msg: "資料提供不完整" });
      }
    }

    const newImage = await Promise.all(
      image.map(async (n) => {
        return await imageCompresser.compressBase64Image(n);
      })
    );

    const isUploadSuccess = fileSize ? false : true;

    const newComment = new QAmessage({
      pointTo: req.question._id,
      content,
      image: newImage,
      isUploadSuccess,
      isPrivate,
      isBest,
      poster: req.user._id,
    });

    await newComment.save();

    let uploadLink = {};
    if (fileSize) {
      try {
        const ViemoRes = await VimeoMethods.upload(
          {
            title: `留言影片:${newComment._id}`,
            fileSize,
            type: "QA",
          },
          { questionID: req.question._id, commentID: newComment._id }
        );
        if (!ViemoRes.success) {
          await QAmessage.findByIdAndDelete(newComment._id);
          return res.json({
            success: false,
            msg: "請求連結發生錯誤",
          });
        }
        uploadLink = ViemoRes.uploadLink;
      } catch {
        await QAmessage.findByIdAndDelete(newComment._id);
        return res.json({
          success: false,
          msg: "請求連結發生錯誤",
        });
      }
    }

    return res.json({
      success: true,
      msg: "留言成功發布，若有影片上傳請使用上傳連結",
      data: { uploadLink, commentID: newComment._id },
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, msg: "發生錯誤，無法成功留言" });
  }
});

router.patch("/uploadVideoStatus", async (req, res) => {
  try {
    const { isUploadSuccess, commentID } = req.body;
    if (typeof isUploadSuccess !== "boolean" || !commentID)
      return res.status(400).json({ success: false, msg: "上傳資料缺少" });

    foundItem = await QAmessage.findById(commentID);

    if (!foundItem)
      return res
        .status(400)
        .json({ success: false, msg: "伺服器無法找到此資源" });

    if (!isUploadSuccess) {
      const newSchedule = new vimeoSchedule({
        method: "delete",
        videoIndex: { commentID: commentID },
      });
      newSchedule.save();
      await QAmessage.findByIdAndDelete(commentID);
      return res.json({ success: true, msg: "已將此資源刪除" });
    }
    foundItem.isUploadSuccess = true;

    let foundVideo = await VimeoMethods.find({ commentID });
    if (foundVideo.success && foundVideo.total !== 0) {
      foundItem.videoURL = foundVideo.data[0].player_embed_url;
    } else {
      const newSchedule = new vimeoSchedule({
        method: "get",
        videoIndex: { commentID: commentID },
        takeTo: {
          schema: "QAmessage",
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

    return res.json({
      success: true,
      msg: "已收到您的回傳結果，影片已就緒",
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理上傳" });
  }
});

router.delete("/deleteComment", async (req, res) => {
  try {
    const { commentID } = req.body;

    const foundComment = QAmessage.findById(commentID);

    if (
      !req.question.courses.some((item) => req.user.courses.includes(item)) &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        msg: `你不屬於本課程`,
      });
    }
    if (req.user.role == "student" && foundComment._id != req.user._id) {
      return res.status(401).json({
        success: false,
        msg: `你沒有刪除此留言的權限`,
      });
    }

    await foundComment.remove();
    return res.json({
      success: true,
      msg: `成功刪除留言`,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: `發生了不可預期的錯誤`,
    });
  }
});

module.exports = router;
