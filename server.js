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

// Demo users (kept simple on purpose; a real site would use a database)
const users = { dave: "password123", sam: "letmein" };

// POST /login: check credentials, then store the username in the session
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.username = username; // the session variable
    res.send('Logged in! Visit your <a href="/profile">profile</a>.');
  } else {
    res.send('Wrong username or password. <a href="login.html">Try again</a>');
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
