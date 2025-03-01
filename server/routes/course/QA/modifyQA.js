const router = require("express").Router();
const Course = require("../../../models").course;
const User = require("../../../models").user;
const QA = require("../../../models").QA;
const imageCompresser = require("../../../methods/imageCompresser");
const accessChecker = require("../../routesMiddleware/accessChecker");

// 由於上傳權限不太一樣且權限劃分較簡單 故不拉出middleWare
router.post("/postQuestion", async (req, res) => {
  try {
    // course_ids 是 array
    let {
      course_ids,
      isPublic = false,
      description,
      image = [],
      resourceCategories = ["無特定主題"],
      hints = ["無特定知識點"],
    } = req.body;

    if (resourceCategories.length === 0) {
      resourceCategories = ["無特定主題"];
    }
    if (hints.length === 0) {
      hints = ["無特定知識點"];
    }

    if (
      !Array.isArray(course_ids) ||
      course_ids.length === 0 ||
      !Array.isArray(image)
    ) {
      return res
        .status(400)
        .json({ success: false, msg: "請提供有效的課程或image陣列" });
    }

    if (isPublic === true && req.user.role === "student") {
      return res
        .status(401)
        .json({ success: false, msg: "你沒有將此問題公開的權利" });
    }
    if (req.user.role !== "admin") {
      const allCoursesIncluded = course_ids.every((courseId) =>
        req.user.courses.includes(courseId)
      );
      if (!allCoursesIncluded) {
        return res
          .status(401)
          .json({ success: false, msg: "你不是此課程的成員" });
      }
    }

    if (isPublic === false && !course_ids.length) {
      return res
        .status(400)
        .json({ success: false, msg: "必須提供上傳課程ID" });
    }
    if (!description && !image) {
      return res
        .status(400)
        .json({ success: false, msg: "敘述與相片必須擇一上傳" });
    }

    const newImage = await Promise.all(
      image.map(async (n) => {
        return await imageCompresser.compressBase64Image(n);
      })
    );

    console.log(Array.isArray(hints));
    console.log(hints);

    const newQA = new QA({
      image: newImage,
      description,
      resourceCategories,
      hints,
      isPublic,
      courses: course_ids,
      poster: req.user._id,
    });

    const savedQA = await newQA.save();
    return res.json({
      success: true,
      msg: "新問題創建成功",
      data: { QA_id: savedQA._id },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.patch(
  "/patchQuestion",
  accessChecker.updateAndDeleteQuestion,
  async (req, res) => {
    try {
      const {
        question_id,
        course_ids,
        isPublic,
        description,
        image,
        resourceCategories,
        hints,
      } = req.body;

      // 檢查 course_ids 與 image 是否為有效的陣列
      if (
        !Array.isArray(course_ids) ||
        course_ids.length === 0 ||
        !Array.isArray(image)
      ) {
        return res
          .status(400)
          .json({ success: false, msg: "請提供有效的課程或image陣列" });
      }

      // 如果有圖片，先進行壓縮處理
      let newImage = [];
      if (image && image.length > 0) {
        newImage = await Promise.all(
          image.map(async (imgBase64) => {
            return await imageCompresser.compressBase64Image(imgBase64);
          })
        );
      }

      // 找到舊的 QA 文件
      const oldQA = await QA.findById(question_id);
      if (!oldQA) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到對應的問題" });
      }

      // 準備要更新的欄位，只更新有提供值的部分
      const updateFields = {
        courses: course_ids,
        isPublic,
        description,
        image: newImage,
        resourceCategories,
        hints,
      };

      Object.entries(updateFields).forEach(([key, value]) => {
        if (value !== undefined) {
          oldQA[key] = value;
        }
      });

      // 儲存更新後的資料
      const savedQA = await oldQA.save();

      return res.json({
        success: true,
        msg: "問題修改成功",
        data: { QA_id: savedQA._id },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: "發生了不可預期的錯誤" });
    }
  }
);

// DELETE: 刪除問題
router.delete(
  "/deleteQuestion",
  accessChecker.updateAndDeleteQuestion,
  async (req, res) => {
    try {
      const { question_id } = req.body;

      // 查詢要刪除的 QA
      const oldQA = await QA.findById(question_id);
      if (!oldQA) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到對應的問題" });
      }

      // 執行刪除
      await oldQA.remove();

      return res.json({
        success: true,
        msg: "問題刪除成功",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: "發生了不可預期的錯誤" });
    }
  }
);

module.exports = router;
