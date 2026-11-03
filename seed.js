// Fills the database with a demo owner and a sample 3-room condo.
// Run with: npm run seed   (safe to re-run; it rebuilds the demo account)
const db = require("./db");
const { hashPassword } = require("./lib/auth");
const { today, currentMonth, addDays, addMonths } = require("./lib/helpers");

const DEMO = { name: "Demo Owner", username: "demo", password: "roomsplit-demo" };

// Remove the old demo account; its rooms, tenants, payments and costs cascade with it
db.prepare("DELETE FROM users WHERE username = ?").run(DEMO.username);
const userId = Number(
  db.prepare("INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)")
    .run(DEMO.name, DEMO.username, hashPassword(DEMO.password)).lastInsertRowid
);

const addExpense = db.prepare("INSERT INTO expenses (user_id, name, category, monthly_amount) VALUES (?, ?, ?, ?)");
[
  ["Mortgage", "Mortgage", 1850],
  ["HOA dues", "HOA", 420],
  ["Georgia Power", "Utilities", 160],
  ["Water & trash", "Utilities", 55],
  ["Fiber internet", "Internet", 70],
  ["Renters' liability insurance", "Insurance", 45],
].forEach(([name, category, amount]) => addExpense.run(userId, name, category, amount));

const addRoom = db.prepare("INSERT INTO rooms (user_id, name, size_sqft, monthly_rent, notes) VALUES (?, ?, ?, ?, ?)");
const roomA = Number(addRoom.run(userId, "Room A", 160, 975, "Primary suite, private bath").lastInsertRowid);
const roomB = Number(addRoom.run(userId, "Room B", 130, 875, "Walk-in closet").lastInsertRowid);
addRoom.run(userId, "Room C", 110, 800, "Faces the courtyard");

// Lease dates are relative to today so the dashboard always has something to show
const now = today();
const addTenant = db.prepare(`INSERT INTO tenants (user_id, room_id, name, email, phone, lease_start, lease_end)
                              VALUES (?, ?, ?, ?, ?, ?, ?)`);
const jordanEnd = addDays(now, 40); // shows up as an upcoming renewal
const jordan = Number(addTenant.run(userId, roomA, "Jordan Reyes", "jordan@example.com", "404-555-0142",
  addDays(jordanEnd, -364), jordanEnd).lastInsertRowid);
const priya = Number(addTenant.run(userId, roomB, "Priya Shah", "priya@example.com", "404-555-0187",
  `${addMonths(currentMonth(), -6)}-01`, addDays(`${addMonths(currentMonth(), 6)}-01`, -1)).lastInsertRowid);

// Five months of rent history; Priya paid late once and hasn't paid this month yet
const addPayment = db.prepare("INSERT INTO payments (user_id, tenant_id, amount, paid_on, for_month, note) VALUES (?, ?, ?, ?, ?, ?)");
for (let i = 5; i >= 1; i--) {
  const month = addMonths(currentMonth(), -i);
  addPayment.run(userId, jordan, 975, `${month}-01`, month, "Zelle");
  addPayment.run(userId, priya, 875, i === 2 ? `${month}-09` : `${month}-03`, month, i === 2 ? "Paid late" : "Venmo");
}
addPayment.run(userId, jordan, 975, `${currentMonth()}-01`, currentMonth(), "Zelle");

console.log(`Demo data ready. Log in as "${DEMO.username}" (password is in seed.js).`);
