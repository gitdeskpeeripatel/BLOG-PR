require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./configs/db');
const userRouter = require('./routers/userRouter');
const blogRouter = require('./routers/blogRouter');
const Blog = require('./models/blog');

const app = express();
const PORT = process.env.PORT || 8080;

// DB
connectDB();

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// expose user from cookie to views
app.use((req, res, next) => {
  try {
    // cookie 'user' stores minimal user info JSON-stringified
    res.locals.user = req.signedCookies.user ? JSON.parse(req.signedCookies.user) : null;
  } catch (err) {
    res.locals.user = null;
  }
  next();
});

// root -> show login if not logged in
app.get('/', (req, res) => {
  if (!res.locals.user) return res.redirect('/user/signin');
  return res.redirect('/home');
});

// home page (main)
app.get('/home', async (req, res) => {
  if (!res.locals.user) return res.redirect('/user/signin');
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    res.render('index', { title: 'Home', blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// routers
app.use('/user', userRouter);
app.use('/blog', blogRouter);

// 404
app.use((req, res) => res.status(404).send('Not found'));

// start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
