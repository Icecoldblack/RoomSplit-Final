const express = require("express");
const session = require("express-session");
const app = express();

// Parse form data (login form) and serve files from /public
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup: the session id is stored in a cookie, the data stays on the server
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret", // signs the session id cookie
  resave: false,             // don't resave unchanged sessions
  saveUninitialized: false,  // don't create sessions until something is stored
  cookie: { maxAge: 60000 * 60, httpOnly: true, secure: false } // 1 hour
}));

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
