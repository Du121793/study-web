const mongoose = require("mongoose");
const { Schema } = mongoose;

const takeToSchema = new Schema(
  {
    schema: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
  },
  { _id: false }
);

const vimeoScheduleSchema = new Schema({
  method: {
    type: String,
    enum: ["get", "delete"],
    required: true,
  },
  videoIndex: {
    type: Map,
    of: String,
    required: true,
  },
  takeTo: {
    type: takeToSchema,
    required: function () {
      // 如果 method 為 "get"，則 takeTo 必須存在
      return this.method === "get";
    },
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("vimeoSchedule", vimeoScheduleSchema);
