const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date },
  phone: { type: String },
  password: { type: String, required: true },
  avatar: { type: String, default: '/images/default-user.png' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
