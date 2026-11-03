// Formatting and date helpers shared by routes and views

function money(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// Dates are stored as "YYYY-MM-DD" text; build them from local time, not UTC
function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function today() {
  return isoDate(new Date());
}

function currentMonth() {
  return today().slice(0, 7);
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Adds whole months to "YYYY-MM" (negative to go back)
function addMonths(yyyyMm, count) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const date = new Date(y, m - 1 + count, 1);
  return isoDate(date).slice(0, 7);
}

module.exports = { money, isoDate, today, currentMonth, formatDate, monthLabel, addMonths };
