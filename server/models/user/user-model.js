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

userSchema.methods.isStudent = function () {
  return this.role == "student";
};

userSchema.methods.isTeacher = function () {
  return this.role == "teacher";
};

module.exports = mongoose.model("User", userSchema);
