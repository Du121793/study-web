const mongoose = require("mongoose");
const { Schema } = mongoose;

const QASchema = new Schema({
  image: {
    type: [String],
  },
  description: {
    required: true,
    type: String,
    maxlength: 30,
  },
  resourceCategories: {
    required: true,
    type: [String],
  },
  hints: {
    required: true,
    type: [String],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  courses: {
    type: [String],
    default: [],
  },
  messages: {
    type: [String],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QA", QASchema);
