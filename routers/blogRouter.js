const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blogController = require('../controller/blog.controller');
const userController = require("../controller/userController");
const { ensureAuth } = require('../middlewares/auth');

// multer for blog images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// list blogs (home also shows list)
router.get('/', blogController.getAllBlogs);

// add blog (form + submit)
router.get('/add', userController.ensureAuth, blogController.addPage);
router.post(
  '/add',
  userController.ensureAuth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'authorImage', maxCount: 1 }
  ]),
  blogController.createBlog
);

// ✅ Search route pehle rakha
router.get('/search', blogController.searchBlogs);

// blog detail
router.get('/:id', blogController.getBlogById);

// edit / update / delete (only author allowed in controller)
router.get('/:id/edit', userController.ensureAuth, blogController.editPage);
router.post(
  '/:id/edit',
  userController.ensureAuth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'authorImage', maxCount: 1 }
  ]),
  blogController.updateBlog
);

router.post('/:id/delete', userController.ensureAuth, blogController.deleteBlog);

// like + comment
// router.post('/:id/like', userController.ensureAuth, blogController.likeBlog);
// router.post('/:id/comment', ensureAuth, blogController.addComment);

router.post("/:id/like", blogController.likeBlog);
router.post("/:id/comment", blogController.addComment);

module.exports = router;
