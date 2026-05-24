export function showColorChart(): void {
  const btn = document.createElement("button");
  btn.textContent = "🎨 Color Chart";
  btn.style.cssText = `
    position:fixed; top:60px; left:20px; z-index:1000;
    background:#1e3a5f; color:#e2e8f0; border:1px solid #3b82f6;
    padding:10px 18px; border-radius:8px; cursor:pointer;
    font-family:monospace; font-size:13px; font-weight:bold;
  `;

  let chartVisible = false;
  const chart = buildChart();
  chart.style.display = "none";
  document.body.appendChild(chart);

  btn.onclick = () => {
    chartVisible = !chartVisible;
    chart.style.display = chartVisible ? "block" : "none";
  };
  document.body.appendChild(btn);
}

function buildChart(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.style.cssText = `
    position:fixed; top:100px; left:20px; width:240px;
    background:rgba(10,15,30,0.97); border:1px solid #334155;
    border-radius:12px; padding:16px; z-index:999;
    font-family:monospace; color:#e2e8f0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  `;

  const tests = [
    { name: "Starch (Iodine)", positive: "#1a1a8f", negative: "#b8960c", posLabel: "Deep Blue", negLabel: "Yellow-Brown" },
    { name: "Urea (DMAB)", positive: "#d4a800", negative: "#f0f0e0", posLabel: "Deep Yellow", negLabel: "No Change" },
    { name: "Detergent", positive: "#ffffff", negative: "#f0f0f0", posLabel: "Persistent Foam", negLabel: "No Foam" },
    { name: "Cane Sugar", positive: "#cc1a1a", negative: "#f0f0e0", posLabel: "Red", negLabel: "No Change" },
    { name: "H₂O₂ (H₂SO₄)", positive: "#cc1a66", negative: "#f0f0e0", posLabel: "Pink/Red", negLabel: "No Change" },
  ];

  panel.innerHTML = `
    <h3 style="margin:0 0 12px; color:#60a5fa; font-size:13px;
      border-bottom:1px solid #1e3a5f; padding-bottom:8px;">
      🎨 Expected Color Results
    </h3>
    ${tests
      .map(
        (t) => `
      <div style="margin-bottom:10px;">
        <div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">${t.name}</div>
        <div style="display:flex; gap:6px; align-items:center;">
          <div style="width:28px; height:28px; background:${t.positive};
            border-radius:50%; border:2px solid #334155; flex-shrink:0;"></div>
          <div>
            <div style="font-size:10px; color:#22c55e;">✓ ${t.posLabel}</div>
            <div style="font-size:10px; color:#64748b;">✗ ${t.negLabel}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("")}
    <p style="margin:8px 0 0; font-size:10px; color:#475569; text-align:center;">
      Source: vlabs.ac.in / FSSAI
    </p>
  `;

  return panel;
}