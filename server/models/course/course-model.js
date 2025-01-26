const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  courseName: {
    type: String,
    require: true,
    maxlength: 30,
  },
  subject: {
    type: String,
    maxlength: 30,
    require: true,
  },
  grade: {
    type: String,
    require: true,
  },
  courseClass: {
    type: String,
    require: true,
  },
  members: {
    type: [String],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
