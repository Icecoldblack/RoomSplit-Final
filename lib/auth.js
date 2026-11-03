const crypto = require("crypto");

// Passwords are never stored as typed: we keep a random salt plus the scrypt hash
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

// Only allow redirects back to pages on this site (e.g. "/rooms"), never to another host
function safeRedirect(target, fallback) {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//") ? target : fallback;
}

// Guards owner-only pages. Visitors who try to view one are sent to the login page;
// any attempt to add, change or delete data without a login is refused with a 401.
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  if (req.method === "GET") {
    req.session.flash = { type: "info", message: "Please log in to see that page." };
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  res.status(401).render("error", {
    title: "Login required",
    status: 401,
    heading: "You need to be logged in",
    message: "Only logged-in owners can add, change or delete records. Nothing was saved.",
  });
}

module.exports = { hashPassword, verifyPassword, safeRedirect, requireLogin };
