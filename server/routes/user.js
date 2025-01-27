const router = require("express").Router();

router.get("/", (req, res) => {
  try {
    return res.send(req.user);
  } catch (e) {
    return res.status(500).send("發生了不可預期的錯誤");
  }
});

router.get(
  "/:id",
  (req, res, next) => {
    try {
      const { user_id } = req.params;
      if (req.user._id != user_id && req.user.role != "teacher")
        return res.status(401).send("你沒有訪問此資料的權限");
      next();
    } catch (e) {
      res.status(500).send("很抱歉，伺服器目前無法使用本服務");
    }
  },
  (req, res) => {}
);

module.exports = router;
