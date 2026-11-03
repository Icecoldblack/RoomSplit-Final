const express = require("express");
const db = require("../db");
const Form = require("../lib/form");
const { today, currentMonth } = require("../lib/helpers");
const { isLatePayment } = require("../lib/status");

const router = express.Router();

const listPayments = db.prepare(`
  SELECT p.*, t.name AS tenant_name, r.name AS room_name
  FROM payments p
  JOIN tenants t ON t.id = p.tenant_id
  LEFT JOIN rooms r ON r.id = t.room_id
  WHERE p.user_id = ?
  ORDER BY p.paid_on DESC, p.id DESC
`);
const findPayment = db.prepare("SELECT * FROM payments WHERE id = ? AND user_id = ?");
const listTenants = db.prepare(`
  SELECT t.id, t.name, r.monthly_rent
  FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id
  WHERE t.user_id = ? ORDER BY t.name COLLATE NOCASE
`);

// Checks the fields, and that the payment is for one of this owner's tenants
function readPayment(req) {
  const form = new Form(req.body);
  const payment = {
    tenant_id: form.number("tenant_id", "Tenant", { required: true, min: 1, integer: true }),
    amount: form.number("amount", "Amount", { required: true, min: 0.01 }),
    paid_on: form.date("paid_on", "Date paid", { required: true }),
    for_month: form.month("for_month", "Rent month", { required: true }),
    note: form.text("note", "Note", { max: 200 }),
  };
  if (payment.tenant_id && !listTenants.all(req.session.user.id).some((t) => t.id === payment.tenant_id)) {
    form.errors.push("Choose one of your tenants.");
  }
  return { form, payment };
}

router.get("/payments", (req, res) => {
  const month = currentMonth();
  const payments = listPayments.all(req.session.user.id).map((p) => ({ ...p, late: isLatePayment(p) }));
  const collected = payments.filter((p) => p.for_month === month).reduce((sum, p) => sum + p.amount, 0);
  res.render("payments/index", {
    title: "Payments",
    payments,
    collected,
    tenants: listTenants.all(req.session.user.id),
    defaults: { paid_on: today(), for_month: month },
    scripts: ["/js/payments.js"],
  });
});

// Create
router.post("/payments", (req, res) => {
  const { form, payment } = readPayment(req);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect("/payments");
  }
  db.prepare("INSERT INTO payments (user_id, tenant_id, amount, paid_on, for_month, note) VALUES (?, ?, ?, ?, ?, ?)")
    .run(req.session.user.id, payment.tenant_id, payment.amount, payment.paid_on, payment.for_month, payment.note);
  req.session.flash = { type: "success", message: "Payment logged." };
  res.redirect("/payments");
});

router.get("/payments/:id/edit", (req, res, next) => {
  const payment = findPayment.get(req.params.id, req.session.user.id);
  if (!payment) return next(); // not found, or not this owner's payment
  res.render("payments/edit", {
    title: "Edit payment",
    payment,
    tenants: listTenants.all(req.session.user.id),
    scripts: ["/js/payments.js"],
  });
});

// Update
router.post("/payments/:id", (req, res, next) => {
  const existing = findPayment.get(req.params.id, req.session.user.id);
  if (!existing) return next();
  const { form, payment } = readPayment(req);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect(`/payments/${existing.id}/edit`);
  }
  db.prepare("UPDATE payments SET tenant_id = ?, amount = ?, paid_on = ?, for_month = ?, note = ? WHERE id = ? AND user_id = ?")
    .run(payment.tenant_id, payment.amount, payment.paid_on, payment.for_month, payment.note, existing.id, req.session.user.id);
  req.session.flash = { type: "success", message: "Payment updated." };
  res.redirect("/payments");
});

// Delete
router.post("/payments/:id/delete", (req, res, next) => {
  const payment = findPayment.get(req.params.id, req.session.user.id);
  if (!payment) return next();
  db.prepare("DELETE FROM payments WHERE id = ? AND user_id = ?").run(payment.id, req.session.user.id);
  req.session.flash = { type: "success", message: "Payment deleted." };
  res.redirect("/payments");
});

module.exports = router;
