const express = require("express");
const db = require("../db");
const { today, currentMonth, addMonths, addDays, monthLabel } = require("../lib/helpers");
const { roomStatus, rentStatus } = require("../lib/status");

const router = express.Router();

// Leases ending within this many days show up as upcoming renewals
const RENEWAL_WINDOW_DAYS = 60;

const roomsWithTenants = db.prepare(`
  SELECT r.*, t.id AS tenant_id, t.name AS tenant_name, t.lease_start, t.lease_end,
         COALESCE((SELECT SUM(p.amount) FROM payments p
                   WHERE p.tenant_id = t.id AND p.for_month = ?), 0) AS paid_this_month
  FROM rooms r
  LEFT JOIN tenants t ON t.room_id = r.id
  WHERE r.user_id = ?
  ORDER BY r.name COLLATE NOCASE
`);
const renewals = db.prepare(`
  SELECT t.name, t.lease_end, r.name AS room_name
  FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id
  WHERE t.user_id = ? AND t.lease_end BETWEEN ? AND ?
  ORDER BY t.lease_end
`);
const expenseTotal = db.prepare("SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM expenses WHERE user_id = ?");
const collectedByMonth = db.prepare(`
  SELECT for_month, SUM(amount) AS total FROM payments
  WHERE user_id = ? AND for_month BETWEEN ? AND ?
  GROUP BY for_month
`);

router.get("/dashboard", (req, res) => {
  const userId = req.session.user.id;
  const now = today();
  const month = currentMonth();

  const rooms = roomsWithTenants.all(month, userId).map((r) => ({ ...r, status: roomStatus(r, now) }));
  const occupied = rooms.filter((r) => r.status.key === "occupied");
  const costs = expenseTotal.get(userId).total;
  const expectedRent = occupied.reduce((sum, r) => sum + r.monthly_rent, 0);
  const collected = occupied.reduce((sum, r) => sum + r.paid_this_month, 0);

  const overdue = occupied
    .map((r) => ({ ...r, rent: rentStatus(r.monthly_rent, r.paid_this_month, now) }))
    .filter((r) => r.rent.key === "overdue");

  // Rent collected for each of the last six months next to this month's costs
  const firstMonth = addMonths(month, -5);
  const totals = Object.fromEntries(collectedByMonth.all(userId, firstMonth, month).map((m) => [m.for_month, m.total]));
  const chart = Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(firstMonth, i);
    return { label: monthLabel(m).split(" ")[0], income: totals[m] || 0, costs };
  });

  res.render("dashboard", {
    title: "Dashboard",
    month,
    rooms,
    stats: {
      expectedRent,
      collected,
      costs,
      net: expectedRent - costs,
      occupied: occupied.length,
      occupancy: rooms.length ? Math.round((occupied.length / rooms.length) * 100) : 0,
    },
    overdue,
    renewals: renewals.all(userId, now, addDays(now, RENEWAL_WINDOW_DAYS)),
    renewalWindow: RENEWAL_WINDOW_DAYS,
    chart,
    scripts: ["/js/dashboard.js"],
  });
});

module.exports = router;
