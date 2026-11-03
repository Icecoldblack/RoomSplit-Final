const express = require("express");
const db = require("../db");
const { hashPassword, verifyPassword, safeRedirect } = require("../lib/auth");

const router = express.Router();

// Logs the user in by saving them in the session. A fresh session id is issued on
// login so an id handed out before login can't be reused afterwards.
function startSession(req, res, next, user, message, target) {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.user = { id: user.id, name: user.name, username: user.username }; // the session variable
    req.session.flash = { type: "success", message };
    res.redirect(target);
  });
}

router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("register", { title: "Sign up", errors: [], values: {} });
});

router.post("/register", (req, res, next) => {
  const name = (req.body.name || "").trim();
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const confirm = req.body.confirm || "";

  const errors = [];
  if (!name || name.length > 50) errors.push("Enter your name (up to 50 characters).");
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) errors.push("Username must be 3–30 letters, numbers, dots, dashes or underscores.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (password !== confirm) errors.push("Passwords don't match.");
  if (!errors.length && db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) {
    errors.push("That username is already taken.");
  }
  if (errors.length) {
    return res.status(400).render("register", { title: "Sign up", errors, values: { name, username } });
  }

  const result = db
    .prepare("INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)")
    .run(name, username, hashPassword(password));
  const user = { id: Number(result.lastInsertRowid), name, username };
  startSession(req, res, next, user, `Welcome to RoomSplit, ${name}! Start by adding your shared costs and rooms.`, "/dashboard");
});

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", {
    title: "Log in",
    error: null,
    values: {},
    next: req.query.next || "",
    loggedOut: req.query.loggedout === "1",
  });
});

// POST /login: check credentials against the database, then store the user in the session
router.post("/login", (req, res, next) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).render("login", {
      title: "Log in",
      error: "Wrong username or password.",
      values: { username },
      next: req.body.next || "",
    });
  }
  startSession(req, res, next, user, `Welcome back, ${user.name}!`, safeRedirect(req.body.next, "/dashboard"));
});

// POST /logout: destroys the session so the user is gone
router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.redirect("/login?loggedout=1");
  });
});

module.exports = router;
