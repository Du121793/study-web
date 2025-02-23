const router = require("express").Router();
const Course = require("../../../models").course;
const QA = require("../../../models").QA;
const modifyQA = require("./modifyQA");
const checkTeacherAccess = require("../../routesMiddleware/accessChecker").teacher;

router.use("/modifyQA", modifyQA);

router.get("/getPublicQAs", checkTeacherAccess, async (req, res) => {
  try {
    const foundQAs = await QA.find({ isPublic: true });
    return res.json({ success: true, msg: "", data: foundQAs });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "發生了不可預期的錯誤" });
  }
});

router.get("/getCourseQAs/:course_id", async (req, res) => {
  try {
    // 只拿到 _id
    const courseQAs = await QA.find(
      { courses: req.params.course_id },
      "_id image description resourceCategories hints replied date"
    );
    return res.status(200).json({
      success: true,
      msg: "",
      data: courseQAs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "發生了不可預期的錯誤",
    });
  }
});


module.exports = router;
