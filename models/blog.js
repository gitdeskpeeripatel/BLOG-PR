const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, default: null },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, default: 'Anonymous' },
  authorImage: { type: String, default: '/images/default-user.png' },
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);
