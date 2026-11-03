const express = require("express");
const db = require("../db");

const router = express.Router();

// The comparison itself runs in the browser (public/js/scenarios.js) so owners can
// try different numbers instantly; the server supplies their saved rooms and costs.
router.get("/scenarios", (req, res) => {
  const userId = req.session.user.id;
  const rooms = db.prepare("SELECT name, monthly_rent FROM rooms WHERE user_id = ? ORDER BY name COLLATE NOCASE").all(userId);
  const costs = db.prepare("SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM expenses WHERE user_id = ?").get(userId).total;
  res.render("scenarios", { title: "Scenarios", rooms, costs, scripts: ["/js/scenarios.js"] });
});

module.exports = router;
