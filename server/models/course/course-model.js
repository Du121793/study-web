const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  courseName: {
    type: String,
    required: true,
    maxlength: 30,
  },
  subject: {
    type: String,
    maxlength: 30,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  courseClass: {
    type: String,
    required: true,
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
