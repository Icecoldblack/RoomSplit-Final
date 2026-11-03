const path = require("path");
const express = require("express");
const session = require("express-session");
const helpers = require("./lib/helpers");

const app = express();

// Pages are EJS templates in /views; CSS, JS and images are served from /public
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.money = helpers.money;
app.locals.formatDate = helpers.formatDate;
app.locals.monthLabel = helpers.monthLabel;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session setup: the session id is stored in a cookie, the data stays on the server
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret", // signs the session id cookie
  resave: false,             // don't resave unchanged sessions
  saveUninitialized: false,  // don't create sessions until something is stored
  cookie: { httpOnly: true, sameSite: "lax", secure: false }
}));

// Make the logged-in user and any one-time flash message available to every view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => res.render("home", { title: "Home" }));

// Demo users (kept simple on purpose; a real site would use a database)
const users = { dave: "password123", sam: "letmein" };

// POST /login: check credentials, then store the username in the session
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.user = { id: 0, name: username, username }; // the session variable
    res.redirect("/");
  } else {
    res.send('Wrong username or password. <a href="login.html">Try again</a>');
  }
});

// POST /logout: destroys the session so the user is gone
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Anything else is a 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Not found",
    status: 404,
    heading: "Page not found",
    message: "We couldn't find that page.",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RoomSplit running at http://localhost:${PORT}`));
