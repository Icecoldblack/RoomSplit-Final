const express = require("express");
const db = require("../db");
const Form = require("../lib/form");
const { currentMonth } = require("../lib/helpers");
const { leaseStatus, rentStatus } = require("../lib/status");

const router = express.Router();

// Tenants with their room's rent and what they've paid toward the given month
const listTenants = db.prepare(`
  SELECT t.*, r.name AS room_name, r.monthly_rent,
         COALESCE((SELECT SUM(p.amount) FROM payments p
                   WHERE p.tenant_id = t.id AND p.for_month = ?), 0) AS paid_this_month
  FROM tenants t
  LEFT JOIN rooms r ON r.id = t.room_id
  WHERE t.user_id = ?
  ORDER BY t.name COLLATE NOCASE
`);
const findTenant = db.prepare("SELECT * FROM tenants WHERE id = ? AND user_id = ?");
const listRooms = db.prepare(`
  SELECT r.id, r.name, t.id AS tenant_id, t.name AS tenant_name
  FROM rooms r LEFT JOIN tenants t ON t.room_id = r.id
  WHERE r.user_id = ? ORDER BY r.name COLLATE NOCASE
`);

// Checks the fields, and that the chosen room belongs to this owner and is free
function readTenant(req, tenantId = null) {
  const form = new Form(req.body);
  const tenant = {
    name: form.text("name", "Name", { required: true, max: 60 }),
    email: form.text("email", "Email", { max: 100 }),
    phone: form.text("phone", "Phone", { max: 30 }),
    room_id: form.number("room_id", "Room", { min: 1, integer: true }),
    lease_start: form.date("lease_start", "Lease start"),
    lease_end: form.date("lease_end", "Lease end"),
  };
  if (tenant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenant.email)) form.errors.push("Enter a valid email address.");
  if (tenant.lease_start && tenant.lease_end && tenant.lease_end < tenant.lease_start) {
    form.errors.push("Lease end must be on or after the lease start.");
  }
  if (tenant.room_id) {
    const room = listRooms.all(req.session.user.id).find((r) => r.id === tenant.room_id);
    if (!room) form.errors.push("Choose one of your rooms.");
    else if (room.tenant_id && room.tenant_id !== tenantId) form.errors.push(`${room.name} already has a tenant (${room.tenant_name}).`);
  }
  return { form, tenant };
}

router.get("/tenants", (req, res) => {
  const month = currentMonth();
  const tenants = listTenants.all(month, req.session.user.id).map((t) => {
    const lease = leaseStatus(t);
    return {
      ...t,
      lease,
      rent: t.room_id && lease === "active" ? rentStatus(t.monthly_rent, t.paid_this_month) : null,
    };
  });
  res.render("tenants/index", { title: "Tenants", tenants, rooms: listRooms.all(req.session.user.id) });
});

// Create
router.post("/tenants", (req, res) => {
  const { form, tenant } = readTenant(req);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect("/tenants");
  }
  db.prepare(`INSERT INTO tenants (user_id, room_id, name, email, phone, lease_start, lease_end)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.session.user.id, tenant.room_id, tenant.name, tenant.email, tenant.phone, tenant.lease_start, tenant.lease_end);
  req.session.flash = { type: "success", message: `Added ${tenant.name}.` };
  res.redirect("/tenants");
});

router.get("/tenants/:id/edit", (req, res, next) => {
  const tenant = findTenant.get(req.params.id, req.session.user.id);
  if (!tenant) return next(); // not found, or not this owner's tenant
  res.render("tenants/edit", { title: `Edit ${tenant.name}`, tenant, rooms: listRooms.all(req.session.user.id) });
});

// Update
router.post("/tenants/:id", (req, res, next) => {
  const existing = findTenant.get(req.params.id, req.session.user.id);
  if (!existing) return next();
  const { form, tenant } = readTenant(req, existing.id);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect(`/tenants/${existing.id}/edit`);
  }
  db.prepare(`UPDATE tenants SET room_id = ?, name = ?, email = ?, phone = ?, lease_start = ?, lease_end = ?
              WHERE id = ? AND user_id = ?`)
    .run(tenant.room_id, tenant.name, tenant.email, tenant.phone, tenant.lease_start, tenant.lease_end, existing.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Saved changes to ${tenant.name}.` };
  res.redirect("/tenants");
});

// Delete (their payment history is deleted with them)
router.post("/tenants/:id/delete", (req, res, next) => {
  const tenant = findTenant.get(req.params.id, req.session.user.id);
  if (!tenant) return next();
  db.prepare("DELETE FROM tenants WHERE id = ? AND user_id = ?").run(tenant.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Deleted ${tenant.name}.` };
  res.redirect("/tenants");
});

module.exports = router;
