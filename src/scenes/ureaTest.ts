import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TestTube } from "./labScene";
import { showNotification } from "./labScene";

export function runUreaTest(tube: TestTube, scene: Scene): void {
  tube.reagentAdded = "DMAB";

  // Unknown sample contains urea → deep yellow color
  const isAdulterated = true;

  const mat = tube.material as StandardMaterial;

  if (isAdulterated) {
    // Animate: milk white → deep yellow (urea positive)
    animateColorChange(mat, new Color3(0.95, 0.95, 0.9), new Color3(0.95, 0.8, 0.05), 70, scene);
    tube.result = "POSITIVE - Urea detected (deep yellow color)";

    setTimeout(() => {
      showNotification("🟡 Deep yellow = UREA DETECTED in sample!", "error");
    }, 1800);
  } else {
    // Pure milk: no color change remains white/cream
    tube.result = "NEGATIVE - No urea (no color change)";
    setTimeout(() => {
      showNotification("⚪ No color change = No urea. Pure milk.", "success");
    }, 1800);
  }
}

function animateColorChange(
  mat: StandardMaterial,
  from: Color3,
  to: Color3,
  frames: number,
  scene: Scene
): void {
  let frame = 0;
  const observer = scene.onBeforeRenderObservable.add(() => {
    if (frame >= frames) {
      scene.onBeforeRenderObservable.remove(observer);
      return;
    }
    const t = frame / frames;
    mat.diffuseColor = Color3.Lerp(from, to, easeInOut(t));
    frame++;
  });
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}