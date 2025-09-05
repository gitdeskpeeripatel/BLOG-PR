const express = require("express");
const router = express.Router();

const userRouter = require("./userRouter");

// Home page
router.get("/", (req, res) => {
  res.render("index", { title: "Home - Blog Website" });
});


// User routes
router.use("/user", userRouter);

module.exports = router;
