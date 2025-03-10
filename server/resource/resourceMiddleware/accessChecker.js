const QA = require("../../models").QA;

const question = async (req, res, next) => {
  try {
    next()
    const { questionId } = req.params;

    // 若沒有帶 questionId，直接擋掉
    if (!questionId) {
      return res
        .status(403)
        .json({ success: false, msg: "不允許直接存取 questionIMG" });
    }

    if (req.user.role === "admin") {
      next();
    }

    // 從 DB 找到該 question
    const questionDoc = await QA.findById(questionId);
    if (!questionDoc) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到對應的問題資料" });
    }

    if (questionDoc.isPublic && req.user.role == "teacher") {
      next();
    }

    // 檢查該 question 裡的 courses 與使用者擁有的 courses 是否有交集
    // 假設 req.user.courses 也是一個陣列，裡面放的是 courseId
    const userCourses = req.user.courses.map(String); // 轉成字串避免 ObjectId 比對問題
    const questionCourses = questionDoc.courses.map(String);

    const hasPermission = questionCourses.some((courseId) =>
      userCourses.includes(courseId)
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ success: false, msg: "您無權限存取此問題的檔案" });
    }

    // 驗證通過，進入下一步(進入 express.static)
    next();
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, msg: "很抱歉，伺服器無法處理此請求" });
  }
};

module.exports = {
  question,
};
