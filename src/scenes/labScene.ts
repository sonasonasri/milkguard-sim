"use client";

export type TestTube = {
  mesh: any;
  material: any;
  label: string;
  filled: boolean;
  reagentAdded: string | null;
  result: string | null;
};

export type LabState = {
  milkAdded: boolean;
  currentStep: number;
  selectedSample: "pure" | "unknown";
  tubes: TestTube[];
  warnings: number;
  completed: boolean;
};

export const labState: LabState = {
  milkAdded: false,
  currentStep: 0,
  selectedSample: "unknown",
  tubes: [],
  warnings: 0,
  completed: false,
};

export function showNotification(
  message: string,
  type: "success" | "error" | "warning" | "info"
): void {
  if (typeof window === "undefined") return;
  const colors: Record<string, string> = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  };
  let notif = document.getElementById("lab-notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "lab-notification";
    notif.style.cssText = `
      position:fixed;top:80px;left:50%;transform:translateX(-50%);
      padding:12px 28px;border-radius:8px;font-family:monospace;
      font-size:14px;font-weight:bold;color:white;z-index:9999;
      transition:opacity 0.4s;box-shadow:0 4px 16px rgba(0,0,0,0.5);
      pointer-events:none;min-width:280px;text-align:center;
    `;
    document.body.appendChild(notif);
  }
  notif.style.background = colors[type];
  notif.textContent = message;
  notif.style.opacity = "1";
  setTimeout(() => { if (notif) notif.style.opacity = "0"; }, 3500);
}

export async function createLabScene(canvas: HTMLCanvasElement): Promise<() => void> {
  const { Engine }            = await import("@babylonjs/core/Engines/engine");
  const { Scene }             = await import("@babylonjs/core/scene");
  const { Vector3 }           = await import("@babylonjs/core/Maths/math.vector");
  const { Color3, Color4 }    = await import("@babylonjs/core/Maths/math.color");
  const { HemisphericLight }  = await import("@babylonjs/core/Lights/hemisphericLight");
  const { PointLight }        = await import("@babylonjs/core/Lights/pointLight");
  const { ArcRotateCamera }   = await import("@babylonjs/core/Cameras/arcRotateCamera");
  const { MeshBuilder }       = await import("@babylonjs/core/Meshes/meshBuilder");
  const { StandardMaterial }  = await import("@babylonjs/core/Materials/standardMaterial");

  const { runStarchTest }    = await import("./starchTest");
  const { runUreaTest }      = await import("./ureaTest");
  const { runDetergentTest } = await import("./detergentTest");
  const { runSugarTest }     = await import("./sugarTest");
  const { runH2O2Test }      = await import("./h2o2Test");
  const { initLabNotebook, recordObservation } = await import("../components/labNotebook");
  const { initScoring, addPenalty, finalizeScore } = await import("../components/scoring");
  const { showColorChart }   = await import("../components/colorChart");

  // Reset state
  labState.milkAdded   = false;
  labState.currentStep = 0;
  labState.tubes       = [];
  labState.warnings    = 0;
  labState.completed   = false;

  // ── Engine & Scene ──────────────────────────────────────────────────────
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene  = new Scene(engine);
  scene.clearColor = new Color4(0.05, 0.08, 0.12, 1);

  // ── Camera ──────────────────────────────────────────────────────────────
  // noPreventDefault=false so we control when camera gets events
  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3.5, 14, Vector3.Zero(), scene);
  camera.attachControl(canvas, false); // false = don't prevent default
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 22;
  camera.panningSensibility = 0; // disable panning so clicks don't drift

  // ── Lights ──────────────────────────────────────────────────────────────
  const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.55;
  ambient.diffuse   = new Color3(0.9, 0.95, 1);

  const labLight = new PointLight("labLight", new Vector3(0, 6, 0), scene);
  labLight.intensity = 1.3;
  labLight.diffuse   = new Color3(1, 0.98, 0.9);

  // ── Bench ───────────────────────────────────────────────────────────────
  const bench    = MeshBuilder.CreateBox("bench", { width: 14, height: 0.3, depth: 5 }, scene);
  bench.position.y = -1;
  const benchMat = new StandardMaterial("benchMat", scene);
  benchMat.diffuseColor = new Color3(0.85, 0.82, 0.75);
  bench.material = benchMat;

  // ── Floor ───────────────────────────────────────────────────────────────
  const floor    = MeshBuilder.CreateGround("floor", { width: 24, height: 24 }, scene);
  floor.position.y = -1.2;
  const floorMat = new StandardMaterial("floorMat", scene);
  floorMat.diffuseColor = new Color3(0.12, 0.15, 0.2);
  floor.material = floorMat;

  // ── Tube Rack ───────────────────────────────────────────────────────────
  const rack    = MeshBuilder.CreateBox("rack", { width: 7, height: 0.12, depth: 0.9 }, scene);
  rack.position = new Vector3(0, -0.78, 0);
  const rackMat = new StandardMaterial("rackMat", scene);
  rackMat.diffuseColor = new Color3(0.28, 0.22, 0.18);
  rack.material = rackMat;

  // ── Test Tubes ──────────────────────────────────────────────────────────
  const tubeLabels    = ["Starch", "Urea", "Detergent", "Sugar", "H₂O₂"];
  const tubePositions = [-4, -2, 0, 2, 4];

  tubeLabels.forEach((label, i) => {
    const tube    = MeshBuilder.CreateCylinder(`tube_${i}`, { height: 1.8, diameter: 0.35, tessellation: 16 }, scene);
    tube.position = new Vector3(tubePositions[i], 0.1, 0);
    const tubeMat = new StandardMaterial(`tubeMat_${i}`, scene);
    tubeMat.diffuseColor  = new Color3(0.85, 0.95, 1);
    tubeMat.alpha         = 0.6;
    tubeMat.specularColor = new Color3(1, 1, 1);
    tube.material = tubeMat;
    // tag so ray-pick knows what this is
    (tube as any).metadata = { type: "tube", index: i };
    labState.tubes.push({ mesh: tube, material: tubeMat, label, filled: false, reagentAdded: null, result: null });
  });

  // ── Reagent Bottles ─────────────────────────────────────────────────────
  const reagentDefs = [
    { name: "Iodine",     color: new Color3(0.35, 0.08, 0.55), pos: new Vector3(-5,   0, -1.8) },
    { name: "DMAB",       color: new Color3(0.9,  0.85, 0.08), pos: new Vector3(-3.5, 0, -1.8) },
    { name: "Soap",       color: new Color3(0.1,  0.7,  0.9),  pos: new Vector3(-2,   0, -1.8) },
    { name: "Resorcinol", color: new Color3(0.9,  0.3,  0.1),  pos: new Vector3(-0.5, 0, -1.8) },
    { name: "H2SO4",      color: new Color3(0.5,  0.85, 0.15), pos: new Vector3(1,    0, -1.8) },
  ];

  reagentDefs.forEach((r) => {
    const bottle  = MeshBuilder.CreateCylinder(`bottle_${r.name}`, { height: 1.2, diameter: 0.38, tessellation: 12 }, scene);
    bottle.position = r.pos;
    const bMat    = new StandardMaterial(`bMat_${r.name}`, scene);
    bMat.diffuseColor = r.color;
    bMat.alpha = 0.85;
    bottle.material = bMat;
    (bottle as any).metadata = { type: "reagent", name: r.name };
  });

  // ── Milk Bottle ─────────────────────────────────────────────────────────
  const milkBottle  = MeshBuilder.CreateCylinder("milk", { height: 1.1, diameter: 0.52 }, scene);
  milkBottle.position = new Vector3(3.8, 0, -1.8);
  const milkMat     = new StandardMaterial("milkMat", scene);
  milkMat.diffuseColor = new Color3(0.96, 0.96, 0.96);
  milkBottle.material  = milkMat;
  (milkBottle as any).metadata = { type: "milk" };

  // ── Water Bath ──────────────────────────────────────────────────────────
  const bath    = MeshBuilder.CreateBox("bath", { width: 1.6, height: 0.65, depth: 1.1 }, scene);
  bath.position = new Vector3(5.5, -0.68, 0);
  const bathMat = new StandardMaterial("bathMat", scene);
  bathMat.diffuseColor = new Color3(0.45, 0.45, 0.58);
  bath.material = bathMat;

  // ── Labels overlay ──────────────────────────────────────────────────────
  buildLabels();

  // ── Init subsystems ─────────────────────────────────────────────────────
  initLabNotebook();
  initScoring();
  showColorChart();

  // ── CLICK HANDLING via pointer observable (fixes camera conflict) ────────
  let isDragging = false;
  let pointerDownX = 0;
  let pointerDownY = 0;

  scene.onPointerDown = (evt, pickResult) => {
    pointerDownX = evt.clientX;
    pointerDownY = evt.clientY;
    isDragging = false;
  };

  scene.onPointerMove = (evt) => {
    const dx = evt.clientX - pointerDownX;
    const dy = evt.clientY - pointerDownY;
    if (Math.sqrt(dx * dx + dy * dy) > 5) isDragging = true;
  };

  scene.onPointerUp = (evt, pickResult) => {
    // If user dragged → it was camera rotation, not a click
    if (isDragging) return;

    if (!pickResult || !pickResult.hit || !pickResult.pickedMesh) return;
    const mesh = pickResult.pickedMesh;
    const meta = (mesh as any).metadata;
    if (!meta) return;

    if (meta.type === "milk") {
      addMilkToTubes(recordObservation);
    } else if (meta.type === "reagent") {
      handleReagentClick(meta.name, addPenalty);
    } else if (meta.type === "tube") {
      handleTubeClick(
        meta.index, scene,
        addPenalty, recordObservation, finalizeScore,
        runStarchTest, runUreaTest, runDetergentTest, runSugarTest, runH2O2Test
      );
    }
  };

  // ── Hover highlight ─────────────────────────────────────────────────────
  scene.onPointerMove = (evt, pickResult) => {
    const dx = evt.clientX - pointerDownX;
    const dy = evt.clientY - pointerDownY;
    if (Math.sqrt(dx * dx + dy * dy) > 5) isDragging = true;

    canvas.style.cursor =
      pickResult?.hit && (pickResult.pickedMesh as any)?.metadata
        ? "pointer"
        : "default";
  };

  // ── Render loop ─────────────────────────────────────────────────────────
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());

  return () => {
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
    ["lab-notification","lab-hud","notebook-btn","notebook-panel",
     "score-display","chart-btn","chart-panel","lab-labels"].forEach(id => {
      document.getElementById(id)?.remove();
    });
  };
}

// ── State ─────────────────────────────────────────────────────────────────
let selectedReagent: string | null = null;

function addMilkToTubes(recordObservation: (s: string) => void): void {
  if (labState.milkAdded) {
    showNotification("Milk already added to all tubes!", "warning");
    return;
  }
  labState.tubes.forEach((tube) => {
    tube.filled = true;
    tube.material.diffuseColor = { r: 0.95, g: 0.95, b: 0.9 };
    tube.material.alpha = 0.85;
  });
  labState.milkAdded   = true;
  labState.currentStep = 1;
  showNotification("✅ Milk added to all 5 tubes! Now select a reagent.", "success");
  recordObservation("Milk (5ml) dispensed into all 5 test tubes");
}

function handleReagentClick(reagentName: string, addPenalty: (r: string) => void): void {
  if (!labState.milkAdded) {
    addPenalty("Reagent added before milk!");
    showNotification("⚠️ Add milk to tubes first! Click the white bottle.", "error");
    return;
  }
  selectedReagent = reagentName;
  showNotification(`💧 ${reagentName} selected — now click a test tube`, "info");
}

function handleTubeClick(
  index: number, scene: any,
  addPenalty: (r: string) => void,
  recordObservation: (s: string) => void,
  finalizeScore: (s: LabState) => void,
  runStarchTest: any, runUreaTest: any,
  runDetergentTest: any, runSugarTest: any, runH2O2Test: any
): void {
  if (!labState.milkAdded) {
    showNotification("⚠️ Click the WHITE bottle to add milk first!", "error");
    return;
  }
  if (!selectedReagent) {
    showNotification("💡 Select a coloured reagent bottle first!", "info");
    return;
  }
  const tube = labState.tubes[index];
  if (tube.reagentAdded) {
    showNotification(`⚠️ ${tube.label} tube already tested!`, "warning");
    return;
  }

  const correct: Record<number, string>   = { 0:"Iodine", 1:"DMAB", 2:"Soap", 3:"Resorcinol", 4:"H2SO4" };
  const testName: Record<number, string>  = { 0:"Starch", 1:"Urea",  2:"Detergent", 3:"Sugar", 4:"H₂O₂" };
  const runners:  Record<number, any>     = { 0:runStarchTest, 1:runUreaTest, 2:runDetergentTest, 3:runSugarTest, 4:runH2O2Test };

  if (selectedReagent !== correct[index]) {
    addPenalty(`Wrong reagent for ${testName[index]} test!`);
    showNotification(`❌ Wrong reagent! Use ${correct[index]} for ${testName[index]} test.`, "error");
    selectedReagent = null;
    return;
  }

  runners[index](tube, scene);
  recordObservation(`${correct[index]} added to Tube ${index + 1} — ${testName[index]} Test`);
  selectedReagent = null;

  const allDone = labState.tubes.every((t) => t.reagentAdded !== null);
  if (allDone) {
    setTimeout(() => {
      labState.completed = true;
      finalizeScore(labState);
    }, 3500);
  }
}

function buildLabels(): void {
  if (document.getElementById("lab-hud")) return;
  const hud = document.createElement("div");
  hud.id = "lab-hud";
  hud.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:rgba(8,12,22,0.94);border:1px solid #1e3a5f;
    border-radius:12px;padding:14px 28px;color:#e2e8f0;
    font-family:monospace;font-size:13px;display:flex;
    gap:18px;align-items:center;z-index:1000;
    box-shadow:0 8px 32px rgba(0,0,0,0.55);white-space:nowrap;
  `;
  hud.innerHTML = `
    <span style="color:#60a5fa;font-weight:bold;">🧪 MilkGuard</span>
    <span style="color:#334155;">|</span>
    <span>1️⃣ Click <b style="color:#fbbf24">white bottle</b> (milk)</span>
    <span style="color:#334155;">|</span>
    <span>2️⃣ Click <b style="color:#a78bfa">coloured bottle</b> (reagent)</span>
    <span style="color:#334155;">|</span>
    <span>3️⃣ Click <b style="color:#34d399">test tube</b></span>
    <span style="color:#334155;">|</span>
    <span>4️⃣ 📓 Notebook</span>
  `;
  document.body.appendChild(hud);
}