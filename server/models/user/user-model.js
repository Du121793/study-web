const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  lineID: {
    type: String,
  },

  userinfo: {
    username: {
      type: String,
    },
    realname: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
    },
    pictureUrl: {
      type: String,
    },
    makePictureAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  courses: {
    type: [Schema.Types.ObjectId],
    ref: "Course",
    default: [],
  },
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// 添加虛擬欄位來處理匿名頭像
userSchema.virtual("userinfo.displayPictureUrl").get(function () {
  return this.userinfo.makePictureAnonymous ? "" : this.userinfo.pictureUrl;
});

// 確保虛擬欄位在轉換為 JSON 時被包含
const transformFn = function (doc, ret, options) {
  if (ret.userinfo) {
    delete ret.userinfo.pictureUrl;
  }
  return ret;
};

userSchema.set("toJSON", {
  virtuals: true,
  transform: transformFn,
});

userSchema.set("toObject", {
  virtuals: true,
  transform: transformFn,
});

userSchema.methods.isStudent = function () {
  return this.role == "student";
};

userSchema.methods.isTeacher = function () {
  return this.role == "teacher";
};

module.exports = mongoose.model("User", userSchema);
