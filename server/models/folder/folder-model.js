const mongoose = require("mongoose");
const { Schema } = mongoose;
const QA = require("../question/QA-model");

const FolderSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 從 QA 中移除資料夾引用的通用函數
async function removeFolderFromQA(folderId) {
  await QA.updateMany(
    {
      folders: folderId,
      isPublic: true,
    },
    { $pull: { folders: folderId } }
  );
}

// 遞歸刪除子資料夾的通用函數
async function deleteSubFolders(parentId) {
  const subFolders = await mongoose.model("Folder").find({
    parentFolder: parentId,
  });
  for (const subFolder of subFolders) {
    // 使用 deleteOne 來觸發 hook
    await mongoose.model("Folder").deleteOne({ _id: subFolder._id });
  }
}

// findOneAndDelete hook
FolderSchema.pre("findOneAndDelete", async function (next) {
  try {
    const folderToDelete = await this.model.findOne(this.getQuery());
    if (folderToDelete) {
      await removeFolderFromQA(folderToDelete._id);
      await deleteSubFolders(folderToDelete._id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// remove hook
FolderSchema.pre("remove", async function (next) {
  try {
    await removeFolderFromQA(this._id);
    await deleteSubFolders(this._id);
    next();
  } catch (error) {
    next(error);
  }
});

// deleteOne hook
FolderSchema.pre("deleteOne", async function (next) {
  try {
    const folderToDelete = await this.model.findOne(this.getQuery());
    if (folderToDelete) {
      await removeFolderFromQA(folderToDelete._id);
      await deleteSubFolders(folderToDelete._id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// deleteMany hook
FolderSchema.pre("deleteMany", async function (next) {
  try {
    const foldersToDelete = await this.model.find(this.getQuery());
    for (const folder of foldersToDelete) {
      await removeFolderFromQA(folder._id);
      await deleteSubFolders(folder._id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 更新時間戳
FolderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Folder", FolderSchema);
