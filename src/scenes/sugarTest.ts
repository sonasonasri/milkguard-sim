import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TestTube } from "./labScene";
import { showNotification } from "./labScene";

export function runSugarTest(tube: TestTube, scene: Scene): void {
  tube.reagentAdded = "Resorcinol";

  // Unknown sample contains cane sugar
  const isAdulterated = true;

  showNotification("🔥 Boiling water bath started — 5 minutes timer...", "info");

  // Simulate 5 min boiling (5 seconds in simulation)
  const BOIL_TIME_MS = 5000;
  const BOIL_FRAMES = 300;

  // Color starts heating: white → orange → red
  const mat = tube.material as StandardMaterial;
  let frame = 0;

  const heatObserver = scene.onBeforeRenderObservable.add(() => {
    if (frame >= BOIL_FRAMES) {
      scene.onBeforeRenderObservable.remove(heatObserver);
      return;
    }
    const t = frame / BOIL_FRAMES;
    if (isAdulterated) {
      // white → orange (first half) → red (second half)
      if (t < 0.5) {
        mat.diffuseColor = Color3.Lerp(
          new Color3(0.95, 0.95, 0.9),
          new Color3(0.95, 0.5, 0.1),
          t * 2
        );
      } else {
        mat.diffuseColor = Color3.Lerp(
          new Color3(0.95, 0.5, 0.1),
          new Color3(0.85, 0.08, 0.08),
          (t - 0.5) * 2
        );
      }
    }
    frame++;
  });

  if (isAdulterated) {
    tube.result = "POSITIVE - Cane sugar detected (red color after boiling)";
    setTimeout(() => {
      showNotification("🔴 Red color after boiling = CANE SUGAR DETECTED!", "error");
    }, BOIL_TIME_MS);
  } else {
    tube.result = "NEGATIVE - No cane sugar (no color change)";
    setTimeout(() => {
      showNotification("✅ No color change = No cane sugar.", "success");
    }, BOIL_TIME_MS);
  }
}