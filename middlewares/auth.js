// middleware/auth.js
exports.ensureAuth = (req, res, next) => {
  const user = req.signedCookies.user;
  if (!user) return res.redirect('/user/signin');
  next();
};
