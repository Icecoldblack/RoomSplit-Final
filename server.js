const path = require("path");
const express = require("express");
const session = require("express-session");
const helpers = require("./lib/helpers");
const { requireLogin } = require("./lib/auth");

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
  // No maxAge/expires: the browser treats this as a session cookie and deletes it when
  // the browser closes, so the user stays logged in until then (or until they log out)
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
app.get("/about", (req, res) => res.render("about", { title: "About" }));
app.use(require("./routes/auth"));

// Everything below these paths is for logged-in owners only (viewing and changing data)
app.use(["/dashboard", "/rooms", "/tenants", "/payments", "/expenses", "/scenarios"], requireLogin);
app.use(require("./routes/rooms"));
app.use(require("./routes/tenants"));
app.use(require("./routes/payments"));

// Anything else is a 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Not found",
    status: 404,
    heading: "Page not found",
    message: "We couldn't find that page.",
  });
});

// Unexpected errors get a friendly page instead of a stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Error",
    status: 500,
    heading: "Something went wrong",
    message: "Please try again in a moment.",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RoomSplit running at http://localhost:${PORT}`));
