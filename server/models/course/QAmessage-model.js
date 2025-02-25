const mongoose = require("mongoose");
const { Schema } = mongoose;

const QAmessageSchema = new Schema({
  pointTo: { type: mongoose.Schema.Types.ObjectId, ref: "QA", required: true },
  content: {
    type: String,
    maxlength: 3000,
  },
  image: {
    type: [String],
  },
  videoURL: {
    type: [String],
  },
  isUploadSuccess: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  isBest: {
    type: Boolean,
    default: false,
  },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QAmessage", QAmessageSchema);
