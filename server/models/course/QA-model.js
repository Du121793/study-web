const mongoose = require("mongoose");
const { Schema } = mongoose;

const QASchema = new Schema({
  image: {
    type: [String],
  },
  description: {
    required: true,
    type: String,
    maxlength: 300,
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
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QA", QASchema);
