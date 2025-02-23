const router = require("express").Router();
const Course = require("../../../models").course;
const User = require("../../../models").user;
const QA = require("../../../models").QA;
const imageCompresser = require("../../../methods/imageCompresser");

async function updateAndDeleteMiddleware(req, res, next) {
  try {
    const role = req.user.role;
    const updateFields = Object.keys(req.body);
    const qaId = req.params.id; // 資源 ID 從路由參數取得

    // 取得資源，若不存在則回傳 404
    const resource = await QA.findById(qaId);
    if (!resource) {
      return res.status(404).json({ success: false, msg: "資源不存在" });
    }

    // ───────────── admin ─────────────
    if (role === "admin") {
      return next(); // admin 不做任何限制
    }

    // ───────────── student ─────────────
    if (role === "student") {
      // 不允許修改的欄位
      const forbiddenKeys = ["isPublic", "replied", "courses"];
      const invalidKeys = updateFields.filter((key) =>
        forbiddenKeys.includes(key)
      );
      if (invalidKeys.length > 0) {
        return res.status(403).json({
          success: false,
          msg: `學生不能修改這些欄位: ${invalidKeys.join(", ")}`,
        });
      }
      // 若資源已被回覆，則學生無法修改或刪除
      if (resource.replied === true) {
        return res.status(403).json({
          success: false,
          msg: "資源已被回覆，無法修改或刪除",
        });
      }
      // 學生僅允許修改的欄位
      const allowedKeys = [
        "image",
        "description",
        "resourceCategories",
        "hints",
      ];
      const extraKeys = updateFields.filter(
        (key) => !allowedKeys.includes(key)
      );
      if (extraKeys.length > 0) {
        return res.status(403).json({
          success: false,
          msg: `學生只能修改 ${allowedKeys.join(
            ", "
          )}，不允許修改: ${extraKeys.join(", ")}`,
        });
      }
      return next();
    }

    // ───────────── teacher ─────────────
    if (role === "teacher") {
      // 刪除動作 (DELETE)
      if (req.method === "DELETE") {
        // 若資源是公開的，檢查 resource.courses 是否都屬於此老師
        if (resource.isPublic) {
          const allCoursesIncluded = resource.courses.every((courseId) =>
            req.user.courses.includes(courseId)
          );
          if (!allCoursesIncluded) {
            return res.status(403).json({
              success: false,
              msg: "公開資源中包含非此教師的課程，無法執行刪除",
            });
          }
        }
        return next();
      }

      // 更新動作 (PUT)
      if (req.method === "PUT") {
        // 教師允許修改的欄位
        const allowedKeys = [
          "isPublic",
          "replied",
          "courses",
          "hints",
          "resourceCategories",
        ];
        const invalidKeys = updateFields.filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          return res.status(403).json({
            success: false,
            msg: `教師只能修改 ${allowedKeys.join(", ")}`,
          });
        }

        // 若更新中包含 courses 欄位，需做進階檢查
        if (updateFields.includes("courses")) {
          if (!Array.isArray(req.body.courses)) {
            return res.status(400).json({
              success: false,
              msg: "courses 必須為陣列",
            });
          }

          const oldCourses = resource.courses; // 更新前的課程列表
          const newCourses = req.body.courses; // 更新後的課程列表

          // 計算「被移除」與「被新增」的課程
          const removedCourses = oldCourses.filter(
            (c) => !newCourses.includes(c)
          );
          const addedCourses = newCourses.filter(
            (c) => !oldCourses.includes(c)
          );

          // ───── 被移除的課程 ─────
          if (removedCourses.length > 0 && resource.isPublic) {
            // 資源是公開時，檢查被移除的課程是否都屬於此教師
            const canRemoveAll = removedCourses.every((courseId) =>
              req.user.courses.includes(courseId)
            );
            if (!canRemoveAll) {
              return res.status(403).json({
                success: false,
                msg: "公開資源中嘗試刪除的課程包含非此教師的課程，無法刪除",
              });
            }
          }

          // ───── 被新增的課程 ─────
          if (addedCourses.length > 0) {
            const canAddAll = addedCourses.every((courseId) =>
              req.user.courses.includes(courseId)
            );
            if (!canAddAll) {
              return res.status(403).json({
                success: false,
                msg: "你嘗試新增的課程中，包含你未註冊的課程",
              });
            }
          }
        }
        return next();
      }

      // 其餘方法 (PATCH, POST, etc.) 不支援
      return res.status(403).json({ success: false, msg: "教師不支援此操作" });
    }

    // 若角色非 admin/student/teacher，回傳錯誤
    return res.status(403).json({ success: false, msg: "無法辨識的權限" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
}

// 由於上傳權限不太一樣且權限劃分較簡單 故不拉出middleWare
router.post("/postQuestion", async (req, res) => {
  try {
    // course_ids 是 array
    const {
      course_ids,
      isPublic = false,
      description,
      image,
      resourceCategories = ["無特定主題"],
      hints = ["無特定知識點"],
    } = req.body;

    if (
      !Array.isArray(course_ids) ||
      course_ids.length === 0 ||
      !Array.isArray(image) ||
      image.length === 0
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

    const newQA = new QA({
      image: newImage,
      description,
      resourceCategories,
      hints,
      isPublic,
      courses: course_ids,
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

module.exports = router;
