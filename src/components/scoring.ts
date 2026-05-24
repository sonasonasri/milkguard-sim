import { LabState } from "../scenes/labScene";

let score = 100;
let penalties = 0;
const penaltyLog: string[] = [];

export function initScoring(): void {
  const scoreDisplay = document.createElement("div");
  scoreDisplay.id = "score-display";
  scoreDisplay.style.cssText = `
    position:fixed; top:20px; left:20px; z-index:1000;
    background:rgba(10,15,30,0.92); border:1px solid #334155;
    border-radius:8px; padding:10px 16px; font-family:monospace;
    font-size:13px; color:#e2e8f0;
  `;
  scoreDisplay.innerHTML = `
    <span style="color:#94a3b8;">Score: </span>
    <span id="score-value" style="color:#22c55e; font-weight:bold; font-size:16px;">100</span>
    <span style="color:#94a3b8;"> / 100</span>
  `;
  document.body.appendChild(scoreDisplay);
}

export function addPenalty(reason: string): void {
  const deduction = 10;
  score = Math.max(0, score - deduction);
  penalties++;
  penaltyLog.push(reason);

  const scoreEl = document.getElementById("score-value");
  if (scoreEl) {
    scoreEl.textContent = score.toString();
    scoreEl.style.color = score > 70 ? "#22c55e" : score > 40 ? "#f59e0b" : "#ef4444";

    // Flash red on penalty
    scoreEl.style.animation = "none";
    scoreEl.offsetHeight; // reflow
    scoreEl.style.transition = "color 0.3s";
  }
}

export function finalizeScore(labState: LabState): void {
  const correctResults = labState.tubes.filter((t) => t.result?.includes("POSITIVE")).length;
  const procedureBonus = labState.warnings === 0 ? 10 : 0;
  const finalScore = Math.min(100, score + procedureBonus);

  // Health risk data from FSSAI
  const healthRisks: Record<string, string> = {
    Starch: "Starch adulteration causes digestive disorders and nutritional deficiency in infants.",
    Urea: "Urea is toxic and causes kidney damage with prolonged consumption.",
    Detergent: "Detergents cause gastrointestinal disorders, vomiting, and liver damage.",
    Sugar: "Excess cane sugar disrupts metabolism and masks protein deficiency.",
    "H₂O₂": "Hydrogen peroxide destroys beneficial bacteria and causes stomach irritation.",
  };

  const detectedAdulterants = labState.tubes
    .filter((t) => t.result?.includes("POSITIVE"))
    .map((t) => t.label);

  showFinalReport(finalScore, detectedAdulterants, healthRisks, penaltyLog);
}

function showFinalReport(
  finalScore: number,
  detected: string[],
  risks: Record<string, string>,
  penalties: string[]
): void {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.85);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;

  const scoreColor = finalScore >= 80 ? "#22c55e" : finalScore >= 50 ? "#f59e0b" : "#ef4444";
  const grade = finalScore >= 80 ? "Excellent" : finalScore >= 60 ? "Good" : "Needs Improvement";

  const risksHTML = detected
    .map(
      (a) => `
      <div style="background:#1a0a0a; border-left:3px solid #ef4444;
        padding:8px 12px; border-radius:4px; margin-bottom:6px;">
        <b style="color:#fca5a5;">⚠️ ${a}:</b>
        <span style="color:#fecaca; font-size:11px;"> ${risks[a] || "Health risk identified."}</span>
      </div>
    `
    )
    .join("");

  const penaltiesHTML =
    penalties.length > 0
      ? penalties
          .map(
            (p) =>
              `<li style="color:#fbbf24; font-size:11px;">-10pts: ${p}</li>`
          )
          .join("")
      : '<li style="color:#22c55e; font-size:11px;">No penalties! Perfect procedure.</li>';

  overlay.innerHTML = `
    <div style="background:#0a0f1e; border:1px solid #334155; border-radius:16px;
      padding:32px; max-width:520px; width:90%; font-family:monospace; color:#e2e8f0;
      box-shadow:0 20px 60px rgba(0,0,0,0.8);">
      
      <h2 style="text-align:center; margin:0 0 8px; color:#60a5fa; font-size:20px;">
        🧪 Lab Report Complete
      </h2>
      <p style="text-align:center; color:#475569; font-size:12px; margin:0 0 24px;">
        MilkGuard Virtual Biochemistry Lab
      </p>

      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:56px; font-weight:bold; color:${scoreColor};">${finalScore}</div>
        <div style="color:#94a3b8; font-size:14px;">out of 100 — <b style="color:${scoreColor};">${grade}</b></div>
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="color:#ef4444; font-size:13px; margin:0 0 8px;">
          🔴 Adulterants Detected (${detected.length}/5):
        </h3>
        ${risksHTML || '<p style="color:#22c55e; font-size:12px;">No adulterants detected — Pure milk!</p>'}
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="color:#f59e0b; font-size:13px; margin:0 0 8px;">📋 Procedure Log:</h3>
        <ul style="margin:0; padding-left:16px;">${penaltiesHTML}</ul>
      </div>

      <div style="background:#0f172a; border-radius:8px; padding:12px; margin-bottom:20px;">
        <p style="margin:0; color:#64748b; font-size:11px; text-align:center;">
          Based on FSSAI standards for milk quality testing.<br>
          Report generated: ${new Date().toLocaleString()}
        </p>
      </div>

      <button onclick="this.parentElement.parentElement.remove()"
        style="width:100%; background:#1d4ed8; color:white; border:none;
        border-radius:8px; padding:12px; cursor:pointer; font-family:monospace;
        font-size:14px; font-weight:bold;">
        ✅ Close Report
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}