const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  image: {
    type: [String],
    default: [],
  },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Board", boardSchema);
