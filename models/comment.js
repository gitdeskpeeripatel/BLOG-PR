const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  user: { type: String, required: true }, // simple string username
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);
