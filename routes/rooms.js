const express = require("express");
const db = require("../db");
const Form = require("../lib/form");
const { roomStatus } = require("../lib/status");

const router = express.Router();

// Rooms with the tenant assigned to each one (a room holds at most one tenant)
const listRooms = db.prepare(`
  SELECT r.*, t.id AS tenant_id, t.name AS tenant_name, t.lease_start, t.lease_end
  FROM rooms r
  LEFT JOIN tenants t ON t.room_id = r.id
  WHERE r.user_id = ?
  ORDER BY r.name COLLATE NOCASE
`);
const findRoom = db.prepare("SELECT * FROM rooms WHERE id = ? AND user_id = ?");

function readRoom(body) {
  const form = new Form(body);
  const room = {
    name: form.text("name", "Room name", { required: true, max: 40 }),
    size_sqft: form.number("size_sqft", "Size", { min: 1, integer: true }),
    monthly_rent: form.number("monthly_rent", "Monthly rent", { required: true }),
    notes: form.text("notes", "Notes", { max: 200 }),
  };
  return { form, room };
}

router.get("/rooms", (req, res) => {
  const rooms = listRooms.all(req.session.user.id).map((r) => ({ ...r, status: roomStatus(r) }));
  res.render("rooms/index", { title: "Rooms", rooms });
});

// Create
router.post("/rooms", (req, res) => {
  const { form, room } = readRoom(req.body);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect("/rooms");
  }
  db.prepare("INSERT INTO rooms (user_id, name, size_sqft, monthly_rent, notes) VALUES (?, ?, ?, ?, ?)")
    .run(req.session.user.id, room.name, room.size_sqft, room.monthly_rent, room.notes);
  req.session.flash = { type: "success", message: `Added ${room.name}.` };
  res.redirect("/rooms");
});

router.get("/rooms/:id/edit", (req, res, next) => {
  const room = findRoom.get(req.params.id, req.session.user.id);
  if (!room) return next(); // not found, or not this owner's room
  res.render("rooms/edit", { title: `Edit ${room.name}`, room });
});

// Update
router.post("/rooms/:id", (req, res, next) => {
  const existing = findRoom.get(req.params.id, req.session.user.id);
  if (!existing) return next();
  const { form, room } = readRoom(req.body);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect(`/rooms/${existing.id}/edit`);
  }
  db.prepare("UPDATE rooms SET name = ?, size_sqft = ?, monthly_rent = ?, notes = ? WHERE id = ? AND user_id = ?")
    .run(room.name, room.size_sqft, room.monthly_rent, room.notes, existing.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Saved changes to ${room.name}.` };
  res.redirect("/rooms");
});

// Delete (a tenant in this room becomes unassigned rather than deleted)
router.post("/rooms/:id/delete", (req, res, next) => {
  const room = findRoom.get(req.params.id, req.session.user.id);
  if (!room) return next();
  db.prepare("DELETE FROM rooms WHERE id = ? AND user_id = ?").run(room.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Deleted ${room.name}.` };
  res.redirect("/rooms");
});

module.exports = router;
