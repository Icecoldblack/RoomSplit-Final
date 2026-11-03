// Scenario comparison: whole-unit rental vs renting by the room at different occupancy levels
(() => {
  const dataEl = document.getElementById("scenario-data");
  if (!dataEl) return; // no rooms yet
  const { rooms } = JSON.parse(dataEl.textContent);

  const wholeInput = document.getElementById("whole-rent");
  const costsInput = document.getElementById("monthly-costs");
  const occupancyInput = document.getElementById("occupancy");
  const STORAGE_KEY = "roomsplit.wholeUnitRent";

  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const signed = (n) => `${n < 0 ? "−" : n > 0 ? "+" : ""}${money(Math.abs(n))}`;
  const totalRoomRent = rooms.reduce((sum, r) => sum + r.monthly_rent, 0);
  const avgRent = totalRoomRent / rooms.length;

  // Remember the owner's whole-unit estimate in this browser; otherwise start from a guess
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  wholeInput.value = saved ?? Math.round((totalRoomRent * 0.8) / 50) * 50;
  document.getElementById("avg-rent").textContent = money(avgRent);

  function fill(card, values, isWinner) {
    Object.entries(values).forEach(([field, value]) => {
      const dd = card.querySelector(`[data-field="${field}"]`);
      dd.textContent = field === "costs" ? `−${money(value)}` : field === "income" ? money(value) : signed(value);
      dd.classList.toggle("positive", field !== "costs" && field !== "income" && value > 0);
      dd.classList.toggle("negative", field !== "costs" && field !== "income" && value < 0);
    });
    card.classList.toggle("winner", isWinner);
    const badge = card.querySelector("[data-winner]");
    badge.textContent = isWinner ? "Better option" : "";
    badge.className = isWinner ? "badge badge-success" : "badge";
  }

  function render() {
    const whole = Math.max(0, Number(wholeInput.value) || 0);
    const costs = Math.max(0, Number(costsInput.value) || 0);
    const rented = Number(occupancyInput.value);
    try { localStorage.setItem(STORAGE_KEY, String(whole)); } catch {}

    document.getElementById("occupancy-label").textContent = `${rented} of ${rooms.length} (${Math.round((rented / rooms.length) * 100)}%)`;

    const wholeMonthly = whole - costs;
    const roomsIncome = avgRent * rented;
    const roomsMonthly = roomsIncome - costs;

    fill(document.getElementById("card-whole"),
      { income: whole, costs, monthly: wholeMonthly, yearly: wholeMonthly * 12 }, wholeMonthly > roomsMonthly);
    fill(document.getElementById("card-rooms"),
      { income: roomsIncome, costs, monthly: roomsMonthly, yearly: roomsMonthly * 12 }, roomsMonthly > wholeMonthly);

    // Every occupancy level from empty to full
    const rows = [];
    let breakEven = null;
    for (let k = 0; k <= rooms.length; k++) {
      const monthly = avgRent * k - costs;
      if (breakEven === null && monthly >= 0) breakEven = k;
      const diff = (monthly - wholeMonthly) * 12;
      rows.push(`<tr class="${k === rented ? "highlight" : ""}">
        <td>${k} room${k === 1 ? "" : "s"}</td>
        <td>${Math.round((k / rooms.length) * 100)}%</td>
        <td class="text-right num">${money(avgRent * k)}</td>
        <td class="text-right num ${monthly >= 0 ? "positive" : "negative"}">${signed(monthly)}</td>
        <td class="text-right num ${monthly >= 0 ? "positive" : "negative"}">${signed(monthly * 12)}</td>
        <td class="text-right num ${diff >= 0 ? "positive" : "negative"}">${signed(diff)}</td>
      </tr>`);
    }
    document.getElementById("levels").innerHTML = rows.join("");
    document.getElementById("break-even-note").textContent = breakEven === null
      ? `Even with every room rented you'd be ${money(costs - totalRoomRent)}/mo short of your costs.`
      : `You break even with ${breakEven} of ${rooms.length} rooms rented. Income assumes the average room rent of ${money(avgRent)}.`;
  }

  [wholeInput, costsInput, occupancyInput].forEach((input) => input.addEventListener("input", render));
  render();
})();
