// Rent & cost calculator: splits the shared monthly costs across rooms (evenly or by
// square footage) and shows each room's break-even rent and profit at its current rent.
(() => {
  const { total, rooms } = JSON.parse(document.getElementById("calculator-data").textContent);
  const output = document.getElementById("calculator");
  const note = document.querySelector("[data-split-note]");
  const buttons = document.querySelectorAll("[data-split]");

  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const escape = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const allSized = rooms.length > 0 && rooms.every((r) => r.size_sqft > 0);

  function render(method) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.split === method)));

    if (!rooms.length) {
      output.innerHTML = '<div class="empty">Add rooms on the <a href="/rooms">Rooms</a> page to see how costs split.</div>';
      note.textContent = "";
      return;
    }

    const totalSize = rooms.reduce((sum, r) => sum + (r.size_sqft || 0), 0);
    const shareOf = (r) => (method === "size" ? (total * r.size_sqft) / totalSize : total / rooms.length);
    note.textContent = method === "size"
      ? `Bigger rooms carry more of the ${money(total)}/mo in shared costs (${totalSize.toLocaleString()} sq ft in total).`
      : `${money(total)}/mo in shared costs split evenly across ${rooms.length} room${rooms.length === 1 ? "" : "s"}.`;

    let totalRent = 0;
    const rows = rooms.map((r) => {
      const share = shareOf(r);
      const profit = r.monthly_rent - share;
      totalRent += r.monthly_rent;
      return `<tr>
        <td><strong>${escape(r.name)}</strong></td>
        <td class="num">${r.size_sqft ? r.size_sqft + " sq ft" : "—"}</td>
        <td class="text-right num">${money(share)}</td>
        <td class="text-right num">${money(r.monthly_rent)}</td>
        <td class="text-right num ${profit >= 0 ? "positive" : "negative"}">${profit >= 0 ? "+" : "−"}${money(Math.abs(profit))}</td>
      </tr>`;
    });
    const net = totalRent - total;

    output.innerHTML = `<table>
      <thead><tr><th>Room</th><th>Size</th><th class="text-right">Break-even rent</th><th class="text-right">Current rent</th><th class="text-right">Profit / mo</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
      <tfoot><tr>
        <td colspan="2">All rooms rented</td>
        <td class="text-right num">${money(total)}</td>
        <td class="text-right num">${money(totalRent)}</td>
        <td class="text-right num ${net >= 0 ? "positive" : "negative"}">${net >= 0 ? "+" : "−"}${money(Math.abs(net))}</td>
      </tr></tfoot>
    </table>`;
  }

  buttons.forEach((b) => {
    if (b.dataset.split === "size" && !allSized) {
      b.disabled = true;
      b.title = "Add a size to every room to split by size";
    }
    b.addEventListener("click", () => render(b.dataset.split));
  });
  render("even");
})();
