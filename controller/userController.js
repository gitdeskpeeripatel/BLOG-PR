const User = require('../models/userModel');
const Blog = require('../models/blog');
const bcrypt = require('bcrypt');

const COOKIE_NAME = 'user';
const COOKIE_OPTIONS = {
  signed: true,
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
};

// 🔹 Show signup page
exports.signupPage = (req, res) => res.render('pages/auth/signup', { title: 'Sign up' });

// 🔹 Signup handler
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, dob, phone } = req.body;
    if (!fullName || !email || !password) return res.redirect('/user/signup');

    const exists = await User.findOne({ email });
    if (exists) return res.redirect('/user/signup');

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      email,
      password: hashed,
      dob: dob || null,
      phone: phone || ''
    });

    if (req.file) user.avatar = '/uploads/' + req.file.filename;

    await user.save();

    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar
    };
    res.cookie(COOKIE_NAME, JSON.stringify(safeUser), COOKIE_OPTIONS);

    // ✅ Redirect to index page
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/user/signup');
  }
};

// 🔹 Show login page
exports.loginPage = (req, res) => res.render('pages/auth/signin', { title: 'Sign in' });

// 🔹 Login handler
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.redirect('/user/signin');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.redirect('/user/signin');

    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar
    };
    res.cookie(COOKIE_NAME, JSON.stringify(safeUser), COOKIE_OPTIONS);

    // ✅ Redirect to index page
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/user/signin');
  }
};

exports.profilePage = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!safeUser) return res.redirect('/user/signin');

    const myBlogs = await Blog.find({ authorId: safeUser._id }).sort({ createdAt: -1 }).lean();

    res.render('pages/auth/profile', { user: safeUser, myBlogs, title: 'Profile' });
  } catch (err) {
    console.error(err);
    res.redirect('/home');
  }
};


// 🔹 Logout
exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/user/signin');
};

// 🔹 Middleware to enforce auth
exports.ensureAuth = (req, res, next) => {
  try {
    const signed = req.signedCookies[COOKIE_NAME];
    if (!signed) return res.redirect('/user/signin');
    next();
  } catch (err) {
    return res.redirect('/user/signin');
  }
};

// 🔹 Profile page
exports.profilePage = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user
      ? JSON.parse(req.signedCookies.user)
      : null;
    if (!safeUser) return res.redirect('/user/signin');

    const myBlogs = await Blog.find({ authorId: safeUser._id })
      .sort({ createdAt: -1 })
      .lean();

    const user = await User.findById(safeUser._id).lean();
    res.render('pages/auth/profile', { title: 'Profile', user, myBlogs });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// 🔹 Edit profile page
exports.editProfilePage = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user
      ? JSON.parse(req.signedCookies.user)
      : null;
    if (!safeUser) return res.redirect('/user/signin');

    const user = await User.findById(safeUser._id).lean();
    res.render('pages/auth/editProfile', { title: 'Edit Profile', user });
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile');
  }
};

// 🔹 Update profile
exports.updateProfile = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user
      ? JSON.parse(req.signedCookies.user)
      : null;
    if (!safeUser) return res.redirect('/user/signin');

    const { fullName, email, dob, phone } = req.body;
    const update = { fullName, email, dob: dob || null, phone: phone || '' };

    if (req.file) update.avatar = '/uploads/' + req.file.filename;

    const updated = await User.findByIdAndUpdate(safeUser._id, update, {
      new: true
    }).lean();

    const safe = {
      _id: updated._id,
      fullName: updated.fullName,
      email: updated.email,
      avatar: updated.avatar
    };
    res.cookie(COOKIE_NAME, JSON.stringify(safe), COOKIE_OPTIONS);

    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile');
  }
};

// 🔹 Delete profile + blogs
exports.deleteProfile = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user
      ? JSON.parse(req.signedCookies.user)
      : null;
    if (!safeUser) return res.redirect('/user/signin');

    await User.findByIdAndDelete(safeUser._id);
    await Blog.deleteMany({ authorId: safeUser._id });

    res.clearCookie(COOKIE_NAME);
    res.redirect('/user/signin');
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile');
  }
};

