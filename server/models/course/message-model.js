const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  content: {
    type: String,
    maxlength: 3000,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  poster: {
    name: {
      type: String,
    },
    realname: {
      type: String,
    },
    role: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("message", messageSchema);
