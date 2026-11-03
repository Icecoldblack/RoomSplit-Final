const express = require("express");
const db = require("../db");
const Form = require("../lib/form");

const router = express.Router();

const CATEGORIES = ["Mortgage", "HOA", "Utilities", "Internet", "Insurance", "Property tax", "Maintenance", "Other"];

const listExpenses = db.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY monthly_amount DESC, name COLLATE NOCASE");
const findExpense = db.prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?");
const listRooms = db.prepare("SELECT name, size_sqft, monthly_rent FROM rooms WHERE user_id = ? ORDER BY name COLLATE NOCASE");

function readExpense(body) {
  const form = new Form(body);
  const expense = {
    name: form.text("name", "Name", { required: true, max: 60 }),
    category: form.choice("category", "Category", CATEGORIES),
    monthly_amount: form.number("monthly_amount", "Monthly amount", { required: true }),
  };
  return { form, expense };
}

router.get("/expenses", (req, res) => {
  const expenses = listExpenses.all(req.session.user.id);
  const total = expenses.reduce((sum, e) => sum + e.monthly_amount, 0);
  res.render("expenses/index", {
    title: "Shared costs",
    expenses,
    total,
    categories: CATEGORIES,
    rooms: listRooms.all(req.session.user.id),
    scripts: ["/js/calculator.js"],
  });
});

// Create
router.post("/expenses", (req, res) => {
  const { form, expense } = readExpense(req.body);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect("/expenses");
  }
  db.prepare("INSERT INTO expenses (user_id, name, category, monthly_amount) VALUES (?, ?, ?, ?)")
    .run(req.session.user.id, expense.name, expense.category, expense.monthly_amount);
  req.session.flash = { type: "success", message: `Added ${expense.name}.` };
  res.redirect("/expenses");
});

router.get("/expenses/:id/edit", (req, res, next) => {
  const expense = findExpense.get(req.params.id, req.session.user.id);
  if (!expense) return next(); // not found, or not this owner's cost
  res.render("expenses/edit", { title: `Edit ${expense.name}`, expense, categories: CATEGORIES });
});

// Update
router.post("/expenses/:id", (req, res, next) => {
  const existing = findExpense.get(req.params.id, req.session.user.id);
  if (!existing) return next();
  const { form, expense } = readExpense(req.body);
  if (!form.ok) {
    form.flashErrors(req);
    return res.redirect(`/expenses/${existing.id}/edit`);
  }
  db.prepare("UPDATE expenses SET name = ?, category = ?, monthly_amount = ? WHERE id = ? AND user_id = ?")
    .run(expense.name, expense.category, expense.monthly_amount, existing.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Saved changes to ${expense.name}.` };
  res.redirect("/expenses");
});

// Delete
router.post("/expenses/:id/delete", (req, res, next) => {
  const expense = findExpense.get(req.params.id, req.session.user.id);
  if (!expense) return next();
  db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(expense.id, req.session.user.id);
  req.session.flash = { type: "success", message: `Deleted ${expense.name}.` };
  res.redirect("/expenses");
});

module.exports = router;
