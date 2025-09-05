const Blog = require('../models/blog');
const Like = require('../models/like.model');
const Comment = require('../models/comment');

// Get all blogs for index page
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    const blogIds = blogs.map(b => b._id);

    // Likes count
    const likesData = await Like.aggregate([
      { $match: { blog: { $in: blogIds } } },
      { $group: { _id: "$blog", count: { $sum: 1 } } }
    ]);
    const likesMap = {};
    likesData.forEach(like => {
      likesMap[like._id.toString()] = like.count;
    });

    // Comments count
    const commentsData = await Comment.aggregate([
      { $match: { blog: { $in: blogIds } } },
      { $group: { _id: "$blog", count: { $sum: 1 } } }
    ]);
    const commentsMap = {};
    commentsData.forEach(c => {
      commentsMap[c._id.toString()] = c.count;
    });

    // Attach likes & comments count to each blog
    blogs.forEach(blog => {
      const key = blog._id.toString();
      blog.likes = likesMap[key] || 0;
      blog.commentsCount = commentsMap[key] || 0;
    });

    res.render("index", { title: "Home", blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
};

// Get single blog for detail page
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) return res.redirect("/blog");

    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    let myBlogs = [];
    if (safeUser) {
      myBlogs = await Blog.find({ authorId: safeUser._id }).sort({ createdAt: -1 }).lean();
    }

    // Get comments for this blog
    const comments = await Comment.find({ blog: blog._id }).sort({ createdAt: -1 }).lean();
    if (comments.length > 0) blog.comments = comments;

    // Get likes count (unique by user)
    const likes = await Like.aggregate([
      { $match: { blog: blog._id } },
      { $group: { _id: "$blog", users: { $addToSet: "$user" } } },
      { $project: { count: { $size: "$users" } } }
    ]);
    const likesCount = likes.length > 0 ? likes[0].count : 0;

    // Check if current user liked
    let userLiked = false;
    if (safeUser) {
      userLiked = await Like.exists({ blog: blog._id, user: safeUser._id });
    }

    res.render("blogDetail", {
      blog,
      myBlogs,
      comments,
      likesCount,
      userLiked,
      title: blog.title
    });

  } catch (err) {
    console.error(err);
    res.redirect("/blog");
  }
};

// Add blog page
exports.addPage = (req, res) => res.render('blog/add', { title: 'Add Blog' });

// Create blog
exports.createBlog = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!safeUser) return res.redirect('/user/signin');

    const { title, content, authorName } = req.body;

    const blog = new Blog({
      title,
      content,
      authorId: safeUser._id,
      authorName: authorName || safeUser.fullName,
      authorImage: req.files['authorImage']
        ? '/uploads/' + req.files['authorImage'][0].filename
        : (safeUser.avatar || '/images/default-user.png'),
      image: req.files['image'] ? '/uploads/' + req.files['image'][0].filename : null
    });

    await blog.save();
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating blog');
  }
};

// Edit blog page
exports.editPage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!blog) return res.redirect('/home');
    if (!safeUser || String(blog.authorId) !== String(safeUser._id)) return res.status(403).send('Forbidden');
    res.render('blog/edit', { title: 'Edit Blog', blog });
  } catch (err) {
    console.error(err);
    res.redirect('/home');
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!blog) return res.redirect('/home');
    if (!safeUser || String(blog.authorId) !== String(safeUser._id)) return res.status(403).send('Forbidden');

    const { title, content } = req.body;
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    if (req.file) blog.image = '/uploads/' + req.file.filename;
    await blog.save();
    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/home');
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!blog) return res.redirect('/home');
    if (!safeUser || String(blog.authorId) !== String(safeUser._id)) return res.status(403).send('Forbidden');

    await Blog.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ blog: blog._id });
    await Like.deleteMany({ blog: blog._id });

    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/home');
  }
};

// Like/unlike blog
exports.likeBlog = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!safeUser) return res.status(401).send("Login required");

    const blogId = req.params.id;

    const existingLike = await Like.findOne({ blog: blogId, user: safeUser._id });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
    } else {
      await Like.updateOne(
        { blog: blogId, user: safeUser._id },
        { $setOnInsert: { blog: blogId, user: safeUser._id } },
        { upsert: true }
      );
    }

    res.redirect(req.get("referer") || "/home");
  } catch (err) {
    console.error("Error liking blog:", err);
    res.status(500).send("Error liking blog");
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const safeUser = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
    if (!safeUser) return res.status(401).send("Login required");

    const blogId = req.params.id;

    await Comment.create({
      blog: blogId,
      user: safeUser.username || "Anonymous",
      text: req.body.text
    });

    res.redirect(`/blog/${blogId}`);
  } catch (err) {
    console.error("Error commenting:", err);
    res.status(500).send("Error commenting");
  }
};

// Search blogs
exports.searchBlogs = async (req, res) => {
  try {
    const q = req.query.query || '';
    if (!q) return res.json([]);
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 }).lean();
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};
