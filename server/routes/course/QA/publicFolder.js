const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Folder = require("../../../models").folder;
const QA = require("../../../models").QA;
const accessChecker = require("../../routesMiddleware/accessChecker");
const { appendFile } = require("fs");

/**
 * 獲取指定資料夾下的所有問題
 * @route GET /getFolderQuestions
 * @param {string} folder_id - 資料夾ID
 * @param {number} [page=1] - 頁碼
 * @param {number} [pageSize=10] - 每頁筆數
 * @param {string} [sortBy="lastUpdate"] - 排序欄位，"createDate"或"lastUpdate"
 * @param {string} [sortOrder="asc"] - 排序方向，"asc"為升序，"desc"為降序
 * @param {string} [sortType="resourceCategories"] - 分群依據，"resourceCategories"或"hints"
 * @returns {Object} 按標籤分組的問題列表及分頁資訊
 */
router.get("/getFolderQuestions", async (req, res) => {
  try {
    const {
      folder_id,
      page = 1,
      pageSize = 10,
      sortBy = "lastUpdate",
      sortOrder = "asc",
      sortType = "resourceCategories",
    } = req.query;

    if (!folder_id) {
      return res.status(400).json({ success: false, msg: "必須提供資料夾ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(folder_id)) {
      return res.status(400).json({ success: false, msg: "無效的資料夾ID" });
    }

    // 檢查資料夾是否存在
    const folder = await Folder.findById(folder_id);
    if (!folder) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到指定的資料夾" });
    }

    // 設置排序欄位和方向
    const sortField = sortBy === "createDate" ? "date" : "lastUpdate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // 構建聚合管道
    const pipeline = [
      // 只選擇包含指定資料夾ID的問題
      {
        $match: {
          folders: new mongoose.Types.ObjectId(folder_id),
          isPublic: true,
        },
      },
      // 添加排序欄位
      {
        $addFields: {
          sortField: `$${sortField}`,
        },
      },
      // 展開標籤陣列
      {
        $unwind: `$${sortType}`,
      },
      // 按排序欄位排序
      {
        $sort: { sortField: sortDirection },
      },
      // 按標籤分組
      {
        $group: {
          _id: `$${sortType}`,
          docs: { $push: "$$ROOT" },
          representative: { $first: "$sortField" },
        },
      },
      // 限制每組文檔數量
      {
        $addFields: {
          docs: { $slice: ["$docs", 3] },
        },
      },
      // 按代表值排序
      {
        $sort: { representative: sortDirection },
      },
      // 分頁處理
      {
        $skip: (parseInt(page) - 1) * parseInt(pageSize),
      },
      {
        $limit: parseInt(pageSize),
      },
    ];

    // 執行聚合查詢
    const groups = await QA.aggregate(pipeline);

    // 處理圖片URL
    const transformedGroups = groups.map((group) => {
      const tag = group._id;
      const docs = group.docs.map((doc) => {
        if (Array.isArray(doc.image)) {
          doc.image = doc.image.map((relPath) => {
            return `${process.env.SERVER_IP}/resource/questionIMG/${relPath}`;
          });
        }
        return doc;
      });
      return { tag, docs };
    });

    return res.json({
      success: true,
      data: transformedGroups,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy,
      sortOrder,
      sortType,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "獲取資料夾問題時發生錯誤" });
  }
});


/**
 * 獲取資料夾列表
 * @route GET /getFolders
 * @param {string} [folder_id] - 要查找子資料夾的父資料夾ID
 * @param {boolean} [isRoot=false] - 是否只獲取根資料夾
 * @returns {Object} 資料夾列表
 */
router.get("/getFolders", async (req, res) => {
  try {
    const { isRoot, folder_id } = req.query;

    // 檢查是否提供了必要的參數
    if (!isRoot && !folder_id) {
      return res.status(400).json({
        success: false,
        msg: "必須提供 folder_id 或 isRoot 參數",
      });
    }

    // 檢查是否同時提供了兩個參數
    if (isRoot && folder_id) {
      return res.status(400).json({
        success: false,
        msg: "folder_id 和 isRoot 參數不能同時使用",
      });
    }

    // 如果 isRoot 為 true，則只查找或創建根資料夾
    if (isRoot === "true") {
      let rootFolder = await Folder.findOne({ isRoot: true });

      // 如果找不到根資料夾，則創建一個
      if (!rootFolder) {
        rootFolder = new Folder({
          name: "root",
          isRoot: true,
        });
        await rootFolder.save();
      }

      return res.json({ success: true, data: [rootFolder] });
    }

    // 如果有提供 folder_id，則查找所有指向此資料夾的子資料夾
    if (!mongoose.Types.ObjectId.isValid(folder_id)) {
      return res.status(400).json({ success: false, msg: "無效的資料夾ID" });
    }

    const subFolders = await Folder.find({ parentFolder: folder_id });
    return res.json({ success: true, data: subFolders });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "獲取資料夾時發生錯誤" });
  }
});

router.use(accessChecker.admin);

// 管理員功能
/**
 * 創建新資料夾
 * @route POST /createFolder
 * @param {string} name - 資料夾名稱
 * @param {string} parentFolder - 父資料夾ID
 * @returns {Object} 新創建的資料夾
 */
router.post("/createFolder", async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, msg: "必須提供資料夾名稱" });
    }

    if (!parentFolder) {
      return res
        .status(400)
        .json({ success: false, msg: "必須提供父資料夾ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(parentFolder)) {
      return res.status(400).json({ success: false, msg: "無效的父資料夾ID" });
    }

    // 檢查父資料夾是否存在
    const parent = await Folder.findById(parentFolder);
    if (!parent) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到指定的父資料夾" });
    }

    const newFolder = new Folder({
      name,
      parentFolder,
    });

    const savedFolder = await newFolder.save();
    return res.status(201).json({ success: true, data: savedFolder });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "創建資料夾時發生錯誤" });
  }
});

/**
 * 更新資料夾
 * @route PATCH /updateFolder
 * @param {string} folder_id - 資料夾ID
 * @param {string} [name] - 新的資料夾名稱
 * @param {string} [parentFolder] - 新的父資料夾ID
 * @returns {Object} 更新後的資料夾
 */
router.patch("/updateFolder", async (req, res) => {
  try {
    const { folder_id, name, parentFolder } = req.body;

    if (!mongoose.Types.ObjectId.isValid(folder_id)) {
      return res.status(400).json({ success: false, msg: "無效的資料夾ID" });
    }

    const folder = await Folder.findById(folder_id);
    if (!folder) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到指定的資料夾" });
    }

    // 檢查是否為根資料夾
    if (folder.isRoot) {
      return res.status(400).json({ success: false, msg: "不能修改根資料夾" });
    }

    // 如果提供了新的父資料夾ID，檢查其有效性
    if (parentFolder !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(parentFolder)) {
        return res
          .status(400)
          .json({ success: false, msg: "無效的父資料夾ID" });
      }

      // 檢查新的父資料夾是否存在
      const newParent = await Folder.findById(parentFolder);
      if (!newParent) {
        return res
          .status(404)
          .json({ success: false, msg: "找不到指定的父資料夾" });
      }

      // 檢查是否會形成循環引用
      let currentParent = newParent;
      while (currentParent) {
        if (currentParent._id.equals(folder_id)) {
          return res
            .status(400)
            .json({ success: false, msg: "不能將資料夾移動到其子資料夾中" });
        }
        currentParent = await Folder.findById(currentParent.parentFolder);
      }

      folder.parentFolder = parentFolder;
    }

    if (name !== undefined) folder.name = name;

    const updatedFolder = await folder.save();
    return res.json({ success: true, data: updatedFolder });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "更新資料夾時發生錯誤" });
  }
});

/**
 * 刪除資料夾
 * @route DELETE /deleteFolder
 * @param {string} folder_id - 要刪除的資料夾ID
 * @returns {Object} 刪除結果
 */
router.delete("/deleteFolder", async (req, res) => {
  try {
    const { folder_id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(folder_id)) {
      return res.status(400).json({ success: false, msg: "無效的資料夾ID" });
    }

    const folder = await Folder.findById(folder_id);
    if (!folder) {
      return res
        .status(404)
        .json({ success: false, msg: "找不到指定的資料夾" });
    }

    // 不允許刪除根資料夾
    if (folder.isRoot) {
      return res.status(400).json({ success: false, msg: "不能刪除根資料夾" });
    }

    await Folder.findByIdAndDelete(folder_id);
    return res.json({ success: true, msg: "資料夾刪除成功" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "刪除資料夾時發生錯誤" });
  }
});

module.exports = router;
