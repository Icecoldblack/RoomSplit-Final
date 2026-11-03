const { today } = require("./helpers");

// Rent is due on the 1st and counts as late after this day of the month
const LATE_AFTER_DAY = 5;

// Where a tenant's lease stands today: "upcoming", "active" or "ended"
function leaseStatus(tenant, on = today()) {
  if (tenant.lease_start && tenant.lease_start > on) return "upcoming";
  if (tenant.lease_end && tenant.lease_end < on) return "ended";
  return "active";
}

// A room is occupied when its tenant's lease is active today
function roomStatus(room, on = today()) {
  if (!room.tenant_id) return { key: "vacant", label: "Vacant", badge: "badge-warning" };
  const lease = leaseStatus({ lease_start: room.lease_start, lease_end: room.lease_end }, on);
  if (lease === "upcoming") return { key: "upcoming", label: "Tenant moving in", badge: "badge-primary" };
  if (lease === "ended") return { key: "ended", label: "Lease ended", badge: "badge-muted" };
  return { key: "occupied", label: "Occupied", badge: "badge-success" };
}

// This month's rent status for a tenant, given their rent and what they've paid for this month
function rentStatus(rent, paidThisMonth, on = today()) {
  if (!rent || paidThisMonth >= rent) return { key: "paid", label: "Paid", badge: "badge-success" };
  const day = Number(on.slice(8, 10));
  if (day > LATE_AFTER_DAY) return { key: "overdue", label: "Overdue", badge: "badge-danger" };
  return { key: "due", label: "Due", badge: "badge-warning" };
}

// A payment is late when it was made after the grace period of the month it covers
function isLatePayment(payment) {
  const deadline = `${payment.for_month}-${String(LATE_AFTER_DAY).padStart(2, "0")}`;
  return payment.paid_on > deadline;
}

module.exports = { LATE_AFTER_DAY, leaseStatus, roomStatus, rentStatus, isLatePayment };
