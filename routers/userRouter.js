const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require("../controller/userController");


// multer for avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// auth pages
router.get('/signup', userController.signupPage);
router.post('/signup', upload.single('avatar'), userController.signup);

router.get('/signin', userController.loginPage);
router.post('/signin', userController.login);

router.get('/logout', userController.logout);

// profile
router.get('/profile', userController.ensureAuth, userController.profilePage);
router.get('/profile/edit', userController.ensureAuth, userController.editProfilePage);
router.post('/profile/edit', userController.ensureAuth, upload.single('avatar'), userController.updateProfile);
router.get('/profile/delete', userController.ensureAuth, userController.deleteProfile);

module.exports = router;
