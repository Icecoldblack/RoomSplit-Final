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

module.exports = { hashPassword, verifyPassword, safeRedirect };
