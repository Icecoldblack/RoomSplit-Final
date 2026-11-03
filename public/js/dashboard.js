// Draws the "rent collected vs costs" bar chart as an SVG from the page's JSON data
(() => {
  const data = JSON.parse(document.getElementById("chart-data").textContent);
  const target = document.getElementById("income-chart");

  const width = 520;
  const height = 240;
  const pad = { top: 16, right: 8, bottom: 28, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => Math.max(d.income, d.costs)), 1);
  // Round the axis up to a tidy number (e.g. 2,743 -> 3,000)
  const step = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / step) * step;
  const y = (v) => pad.top + plotH - (v / top) * plotH;
  const short = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${v}`);
  const money = (v) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const ns = "http://www.w3.org/2000/svg";
  const el = (name, attrs, text) => {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart", role: "img",
    "aria-label": "Rent collected compared with costs for the last six months" });

  // Gridlines and y-axis labels
  for (let i = 0; i <= 4; i++) {
    const value = (top / 4) * i;
    svg.append(el("line", { x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value), class: i ? "grid-line" : "axis" }));
    svg.append(el("text", { x: pad.left - 8, y: y(value) + 4, "text-anchor": "end", class: "label" }, short(value)));
  }

  // Two bars per month: rent collected, then costs
  const group = plotW / data.length;
  const barW = Math.min(22, group / 3);
  data.forEach((d, i) => {
    const x = pad.left + group * i + group / 2;
    [["income", d.income, x - barW - 2], ["expense", d.costs, x + 2]].forEach(([kind, value, bx]) => {
      const bar = el("rect", { x: bx, y: y(value), width: barW, height: Math.max(0, y(0) - y(value)), rx: 3, class: `bar-${kind}` });
      bar.append(el("title", {}, `${d.label}: ${kind === "income" ? "rent collected" : "costs"} ${money(value)}`));
      svg.append(bar);
    });
    svg.append(el("text", { x, y: height - 8, "text-anchor": "middle", class: "label" }, d.label));
  });

  target.append(svg);
})();
