const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoInfoSchema = new Schema({
  title: {
    type: String,
    require: true,
    maxlength: 30,
  },
  courseID: {
    type: String,
    require: true,
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
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VideoInfo", videoInfoSchema);
