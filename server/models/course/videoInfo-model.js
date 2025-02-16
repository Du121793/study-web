const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoInfoSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 30,
  },
  courseID: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["MainClass", "QA", "Other"],
    default: "MainClass",
  },
  description: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  length: {
    type: Number,
  },
  recordDate: {
    type: Date,
    default: Date.now,
  },
  isUploadSuccess: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

videoInfoSchema.index({ isUploadSuccess: 1, date: 1 });

module.exports = mongoose.model("VideoInfo", videoInfoSchema);
