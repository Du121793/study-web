const QA = require("../../models").QA;

const question = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    // 沒有提供 questionId，拒絕存取
    if (!questionId) {
      return res
        .status(403)
        .json({ success: false, msg: "不允許直接存取 questionIMG" });
    }

    // 如果用戶為 admin，直接放行
    if (req.user.role === "admin") {
      return next();
    }

    // 從 DB 找到該問題
    const questionDoc = await QA.findById(questionId);
    if (!questionDoc) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到對應的問題資料" });
    }

    // 若問題為公開，且用戶角色為 teacher 也可放行
    if (questionDoc.isPublic && req.user.role === "teacher") {
      return next();
    }

    // 從 token 中取得用戶的 courses（假設 req.user.courses 為陣列）
    // 為了比對效率，將 courses 轉換成 Set（適用於用戶課程數量較多的情況）
    const userCoursesSet = new Set(req.user.courses.map(String));
    const questionCourses = questionDoc.courses.map(String);

    const hasPermission = questionCourses.some((courseId) =>
      userCoursesSet.has(courseId)
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ success: false, msg: "您無權限存取此問題的檔案" });
    }

    // 通過驗證，進入下一個 middleware（例如 express.static）
    return next();
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理此請求" });
  }
};

module.exports = { question };