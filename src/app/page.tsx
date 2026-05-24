"use client";

import { useEffect, useRef, useState } from "react";

type TestResult = {
  label: string;
  reagent: string;
  result: string;
  color: string;
};

const TESTS = [
  { label: "Starch",    reagent: "Iodine",     positiveColor: "#1a1a8f", positiveText: "Deep Blue — Starch DETECTED",       negativeColor: "#b8960c", negativeText: "Yellow-Brown — No Starch" },
  { label: "Urea",      reagent: "DMAB",        positiveColor: "#d4a800", positiveText: "Deep Yellow — Urea DETECTED",        negativeColor: "#e8e8d0", negativeText: "No Change — No Urea" },
  { label: "Detergent", reagent: "Soap+Shake",  positiveColor: "#ffffff", positiveText: "Persistent Foam — Detergent DETECTED", negativeColor: "#e8e8d0", negativeText: "No Foam — No Detergent" },
  { label: "Cane Sugar",reagent: "Resorcinol",  positiveColor: "#cc1a1a", positiveText: "Red Color — Sugar DETECTED",          negativeColor: "#e8e8d0", negativeText: "No Change — No Sugar" },
  { label: "H₂O₂",     reagent: "H₂SO₄",       positiveColor: "#cc1a66", positiveText: "Pink/Red — H₂O₂ DETECTED",          negativeColor: "#e8e8d0", negativeText: "No Change — No H₂O₂" },
];

const HEALTH_RISKS: Record<string, string> = {
  "Starch":     "Causes digestive disorders and nutritional deficiency in infants.",
  "Urea":       "Toxic — causes kidney damage with prolonged consumption.",
  "Detergent":  "Causes gastrointestinal disorders, vomiting, and liver damage.",
  "Cane Sugar": "Disrupts metabolism and masks protein deficiency.",
  "H₂O₂":      "Destroys beneficial bacteria and causes stomach irritation.",
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<"intro" | "lab" | "report">("intro");
  const [milkAdded, setMilkAdded] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [score, setScore] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  const [animating, setAnimating] = useState<string | null>(null);
  const [showNotebook, setShowNotebook] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: string} | null>(null);

  const notify = (msg: string, type: string) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const addLog = (entry: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${entry}`]);
  };

  const handleAddMilk = () => {
    if (milkAdded) { notify("Milk already added!", "warning"); return; }
    setMilkAdded(true);
    addLog("Milk (5ml) dispensed into all 5 test tubes");
    notify("✅ Milk added to all tubes! Now select a reagent.", "success");
  };

  const handleSelectReagent = (reagent: string) => {
    if (!milkAdded) {
      setScore(s => Math.max(0, s - 10));
      notify("⚠️ Add milk first! Click ADD MILK button.", "error");
      return;
    }
    setSelectedReagent(reagent);
    notify(`💧 ${reagent} selected — now click a TEST button`, "info");
  };

  const handleRunTest = (testIndex: number) => {
    const test = TESTS[testIndex];
    if (!milkAdded) { notify("⚠️ Add milk first!", "error"); return; }
    if (!selectedReagent) { notify("💡 Select a reagent first!", "info"); return; }
    if (results[test.label]) { notify(`${test.label} already tested!`, "warning"); return; }

    if (selectedReagent !== test.reagent) {
      setScore(s => Math.max(0, s - 10));
      notify(`❌ Wrong reagent! Use ${test.reagent} for ${test.label} test.`, "error");
      setSelectedReagent(null);
      return;
    }

    // Correct reagent → run test
    setAnimating(test.label);
    addLog(`${test.reagent} added to Tube ${testIndex + 1} — ${test.label} Test`);
    notify(`🔬 Running ${test.label} test...`, "info");

    setTimeout(() => {
      const newResult: TestResult = {
        label: test.label,
        reagent: test.reagent,
        result: test.positiveText,
        color: test.positiveColor,
      };
      setResults(prev => ({ ...prev, [test.label]: newResult }));
      setAnimating(null);
      setSelectedReagent(null);
      addLog(`Result: ${test.positiveText}`);
      notify(`🔴 ${test.label}: ${test.positiveText}`, "error");
    }, test.label === "Cane Sugar" ? 5000 : 2000);
  };

  const handleSubmit = () => {
    if (Object.keys(results).length < 5) {
      notify("⚠️ Complete all 5 tests before submitting!", "warning");
      return;
    }
    setStep("report");
  };

  const notifColors: Record<string, string> = {
    success: "#22c55e", error: "#ef4444", warning: "#f59e0b", info: "#3b82f6"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "monospace", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{
        background: "rgba(8,12,22,0.97)", borderBottom: "1px solid #1e3a5f",
        padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: 22, fontWeight: "bold", color: "#60a5fa" }}>🧪 MilkGuard</span>
        <span style={{ color: "#475569", fontSize: 13 }}>Virtual Milk Adulteration Detection Lab</span>
        <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 12 }}>● BITsathy Hackathon 2026</span>
        {step === "lab" && (
          <span style={{ background: "#1e3a5f", padding: "4px 12px", borderRadius: 6, fontSize: 13 }}>
            Score: <b style={{ color: score > 70 ? "#22c55e" : score > 40 ? "#f59e0b" : "#ef4444" }}>{score}</b>/100
          </span>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          background: notifColors[notification.type], color: "white",
          padding: "12px 28px", borderRadius: 8, fontWeight: "bold", fontSize: 14,
          zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", textAlign: "center", minWidth: 300
        }}>
          {notification.msg}
        </div>
      )}

      {/* ── INTRO SCREEN ── */}
      {step === "intro" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🧪</div>
          <h1 style={{ fontSize: 32, color: "#60a5fa", margin: "0 0 8px" }}>MilkGuard</h1>
          <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 8, textAlign: "center" }}>
            Virtual Milk Adulteration Detection Lab
          </p>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 32, textAlign: "center", maxWidth: 480 }}>
            You are a food safety engineer. An unknown milk sample has been brought to your lab.
            Perform 5 qualitative chemical tests to identify adulterants.
          </p>
          <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20, marginBottom: 32, maxWidth: 400, width: "100%" }}>
            <p style={{ color: "#60a5fa", fontWeight: "bold", margin: "0 0 12px" }}>📋 Your Task:</p>
            {TESTS.map((t, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                {i + 1}. {t.label} Test → Use <b style={{ color: "#fbbf24" }}>{t.reagent}</b>
              </div>
            ))}
          </div>
          <button onClick={() => setStep("lab")} style={{
            background: "#1d4ed8", color: "white", border: "none",
            padding: "14px 40px", borderRadius: 10, fontSize: 16,
            fontWeight: "bold", cursor: "pointer", fontFamily: "monospace"
          }}>
            🚀 Enter the Lab
          </button>
        </div>
      )}

      {/* ── LAB SCREEN ── */}
      {step === "lab" && (
        <div style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto" }}>

          {/* Step 1: Add Milk */}
          <div style={{ background: "#0f172a", border: `2px solid ${milkAdded ? "#22c55e" : "#3b82f6"}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 12px", color: "#60a5fa", fontSize: 16 }}>
              {milkAdded ? "✅" : "1️⃣"} Step 1 — Add Milk Sample (5ml) to all tubes
            </h2>
            <button onClick={handleAddMilk} disabled={milkAdded} style={{
              background: milkAdded ? "#1e3a1e" : "#1d4ed8", color: milkAdded ? "#22c55e" : "white",
              border: `1px solid ${milkAdded ? "#22c55e" : "#3b82f6"}`,
              padding: "10px 24px", borderRadius: 8, fontSize: 14, cursor: milkAdded ? "default" : "pointer",
              fontFamily: "monospace", fontWeight: "bold"
            }}>
              {milkAdded ? "✅ Milk Added to All Tubes" : "🥛 ADD MILK TO TUBES"}
            </button>
          </div>

          {/* Step 2: Select Reagent */}
          <div style={{ background: "#0f172a", border: `2px solid ${selectedReagent ? "#f59e0b" : "#334155"}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 12px", color: "#60a5fa", fontSize: 16 }}>
              2️⃣ Step 2 — Select Reagent
              {selectedReagent && <span style={{ color: "#f59e0b", marginLeft: 12 }}>→ {selectedReagent} selected</span>}
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {TESTS.map((t) => (
                <button key={t.reagent} onClick={() => handleSelectReagent(t.reagent)} style={{
                  background: selectedReagent === t.reagent ? "#92400e" : "#1e293b",
                  color: selectedReagent === t.reagent ? "#fbbf24" : "#94a3b8",
                  border: `1px solid ${selectedReagent === t.reagent ? "#f59e0b" : "#334155"}`,
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontFamily: "monospace", fontWeight: selectedReagent === t.reagent ? "bold" : "normal"
                }}>
                  🧪 {t.reagent}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Run Tests */}
          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 16px", color: "#60a5fa", fontSize: 16 }}>3️⃣ Step 3 — Run Tests on Tubes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {TESTS.map((t, i) => {
                const done = !!results[t.label];
                const isAnimating = animating === t.label;
                return (
                  <div key={t.label} style={{
                    background: done ? "#0d2a0d" : "#0f172a",
                    border: `2px solid ${done ? "#22c55e" : isAnimating ? "#f59e0b" : "#334155"}`,
                    borderRadius: 10, padding: 16, textAlign: "center"
                  }}>
                    {/* Test tube visual */}
                    <div style={{
                      width: 40, height: 80, margin: "0 auto 10px",
                      background: isAnimating ? "#f59e0b" : done ? results[t.label].color : milkAdded ? "#f0f0e0" : "#334155",
                      borderRadius: "0 0 20px 20px", border: "2px solid #475569",
                      transition: "background 1s ease",
                      position: "relative", overflow: "hidden"
                    }}>
                      {isAnimating && (
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                          background: "linear-gradient(transparent, rgba(255,255,255,0.3))",
                          animation: "pulse 0.5s infinite alternate"
                        }} />
                      )}
                      {t.label === "Detergent" && done && (
                        <div style={{ position: "absolute", top: -8, left: 0, right: 0, height: 16, background: "white", borderRadius: "50%", opacity: 0.9 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: "bold" }}>
                      Tube {i + 1}<br />{t.label}
                    </div>
                    {done ? (
                      <div style={{ fontSize: 11, color: "#22c55e" }}>✅ Done</div>
                    ) : isAnimating ? (
                      <div style={{ fontSize: 11, color: "#f59e0b" }}>⏳ Testing...</div>
                    ) : (
                      <button onClick={() => handleRunTest(i)} style={{
                        background: "#1d4ed8", color: "white", border: "none",
                        padding: "6px 12px", borderRadius: 6, fontSize: 12,
                        cursor: "pointer", fontFamily: "monospace", fontWeight: "bold", width: "100%"
                      }}>
                        ▶ TEST
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results so far */}
          {Object.keys(results).length > 0 && (
            <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 12px", color: "#60a5fa", fontSize: 16 }}>📊 Observations So Far</h2>
              {Object.values(results).map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#0a0f1e", borderRadius: 8, padding: "10px 14px", marginBottom: 8
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: r.color, border: "2px solid #475569", flexShrink: 0 }} />
                  <div>
                    <span style={{ color: "#fca5a5", fontWeight: "bold", fontSize: 13 }}>{r.label}:</span>
                    <span style={{ color: "#cbd5e1", fontSize: 12, marginLeft: 8 }}>{r.result}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lab Notebook */}
          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, color: "#60a5fa", fontSize: 16 }}>📓 Lab Notebook ({log.length} entries)</h2>
              <button onClick={() => setShowNotebook(!showNotebook)} style={{
                background: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
                padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 12
              }}>
                {showNotebook ? "Hide" : "Show"}
              </button>
            </div>
            {showNotebook && (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {log.length === 0
                  ? <p style={{ color: "#475569", fontSize: 12, fontStyle: "italic" }}>No entries yet. Start the experiment!</p>
                  : log.map((entry, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                      {entry}
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} style={{
            width: "100%", background: Object.keys(results).length === 5 ? "#1d4ed8" : "#1e293b",
            color: Object.keys(results).length === 5 ? "white" : "#475569",
            border: `2px solid ${Object.keys(results).length === 5 ? "#3b82f6" : "#334155"}`,
            padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: "bold",
            cursor: Object.keys(results).length === 5 ? "pointer" : "not-allowed",
            fontFamily: "monospace"
          }}>
            {Object.keys(results).length === 5 ? "📋 Submit Lab Report →" : `Complete all tests first (${Object.keys(results).length}/5 done)`}
          </button>
        </div>
      )}

      {/* ── REPORT SCREEN ── */}
      {step === "report" && (
        <div style={{ padding: "20px 16px", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 64 }}>🏆</div>
            <h1 style={{ color: "#60a5fa", margin: "8px 0" }}>Lab Report Complete</h1>
            <div style={{ fontSize: 56, fontWeight: "bold", color: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444" }}>
              {score}
            </div>
            <div style={{ color: "#94a3b8" }}>out of 100 — {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement"}</div>
          </div>

          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ color: "#ef4444", fontSize: 16, margin: "0 0 16px" }}>🔴 Adulterants Detected in Unknown Sample:</h2>
            {Object.values(results).map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: "#0a0f1e", borderLeft: "3px solid #ef4444",
                borderRadius: 8, padding: "12px 16px", marginBottom: 10
              }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: r.color, border: "2px solid #475569", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ color: "#fca5a5", fontWeight: "bold", fontSize: 14 }}>⚠️ {r.label}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>{r.result}</div>
                  <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>
                    Health Risk: {HEALTH_RISKS[r.label]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ color: "#60a5fa", fontSize: 16, margin: "0 0 12px" }}>📋 Lab Notebook Log:</h2>
            {log.map((entry, i) => (
              <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", borderBottom: "1px solid #1e293b" }}>
                {entry}
              </div>
            ))}
          </div>

          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 12, marginBottom: 20, textAlign: "center" }}>
            <p style={{ color: "#475569", fontSize: 11, margin: 0 }}>
              Based on FSSAI standards for milk quality testing. Report generated: {new Date().toLocaleString()}
            </p>
          </div>

          <button onClick={() => { setStep("intro"); setMilkAdded(false); setResults({}); setScore(100); setLog([]); setSelectedReagent(null); }} style={{
            width: "100%", background: "#1d4ed8", color: "white", border: "none",
            padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: "bold",
            cursor: "pointer", fontFamily: "monospace"
          }}>
            🔄 Restart Experiment
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { from { opacity: 0.3; } to { opacity: 0.9; } }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}