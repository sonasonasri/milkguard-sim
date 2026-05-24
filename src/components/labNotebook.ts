interface Observation {
  timestamp: string;
  text: string;
}

const observations: Observation[] = [];
let notebookVisible = false;

export function initLabNotebook(): void {
  // Create notebook button
  const btn = document.createElement("button");
  btn.id = "notebook-btn";
  btn.textContent = "📓 Lab Notebook";
  btn.style.cssText = `
    position:fixed; top:20px; right:20px; z-index:1000;
    background:#1e3a5f; color:#e2e8f0; border:1px solid #3b82f6;
    padding:10px 18px; border-radius:8px; cursor:pointer;
    font-family:monospace; font-size:13px; font-weight:bold;
    transition: background 0.2s;
  `;
  btn.onmouseenter = () => (btn.style.background = "#2563eb");
  btn.onmouseleave = () => (btn.style.background = "#1e3a5f");
  btn.onclick = toggleNotebook;
  document.body.appendChild(btn);

  // Create notebook panel
  const panel = document.createElement("div");
  panel.id = "notebook-panel";
  panel.style.cssText = `
    position:fixed; top:60px; right:20px; width:320px;
    background:rgba(10,15,30,0.97); border:1px solid #334155;
    border-radius:12px; padding:20px; z-index:999;
    font-family:monospace; color:#e2e8f0; display:none;
    max-height:70vh; overflow-y:auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  `;
  panel.innerHTML = `
    <h3 style="margin:0 0 12px; color:#60a5fa; font-size:14px; border-bottom:1px solid #1e3a5f; padding-bottom:8px;">
      🧪 Digital Lab Notebook
    </h3>
    <div id="observations-list" style="font-size:12px; color:#94a3b8; min-height:80px;">
      <p style="color:#475569; font-style:italic;">No observations yet. Start the experiment!</p>
    </div>
    <hr style="border-color:#1e3a5f; margin:12px 0;">
    <div style="display:flex; gap:8px; flex-direction:column;">
      <input id="manual-obs" type="text" placeholder="Add manual observation..."
        style="background:#0f172a; border:1px solid #334155; border-radius:6px;
        padding:8px; color:#e2e8f0; font-family:monospace; font-size:12px; width:100%; box-sizing:border-box;">
      <button onclick="window.addManualObservation()"
        style="background:#1d4ed8; color:white; border:none; border-radius:6px;
        padding:8px; cursor:pointer; font-family:monospace; font-size:12px;">
        + Add Observation
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  // Global function for manual observations
  (window as any).addManualObservation = () => {
    const input = document.getElementById("manual-obs") as HTMLInputElement;
    if (input && input.value.trim()) {
      recordObservation(input.value.trim());
      input.value = "";
    }
  };
}

export function recordObservation(text: string): void {
  const obs: Observation = {
    timestamp: new Date().toLocaleTimeString(),
    text,
  };
  observations.push(obs);
  updateNotebookUI();
}

function updateNotebookUI(): void {
  const list = document.getElementById("observations-list");
  if (!list) return;

  list.innerHTML = observations
    .map(
      (o, i) => `
      <div style="margin-bottom:8px; padding:8px; background:#0f172a;
        border-radius:6px; border-left:3px solid #3b82f6;">
        <span style="color:#475569; font-size:10px;">[${o.timestamp}]</span><br>
        <span style="color:#cbd5e1;">${i + 1}. ${o.text}</span>
      </div>
    `
    )
    .join("");
}

function toggleNotebook(): void {
  const panel = document.getElementById("notebook-panel");
  if (!panel) return;
  notebookVisible = !notebookVisible;
  panel.style.display = notebookVisible ? "block" : "none";
}

export function getObservations(): Observation[] {
  return observations;
}