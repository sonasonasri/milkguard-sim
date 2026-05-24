import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TestTube } from "./labScene";
import { showNotification } from "./labScene";

export function runStarchTest(tube: TestTube, scene: Scene): void {
  tube.reagentAdded = "Iodine";

  // Simulate: unknown sample contains starch → deep blue color
  const isAdulterated = true; // unknown sample has starch

  const mat = tube.material as StandardMaterial;

  if (isAdulterated) {
    // Animate color transition: milk white → deep blue (starch positive)
    animateColorChange(mat, new Color3(0.95, 0.95, 0.9), new Color3(0.05, 0.05, 0.5), 60, scene);
    tube.result = "POSITIVE - Starch detected (deep blue color)";

    setTimeout(() => {
      showNotification("🔵 Deep blue color = STARCH DETECTED in sample!", "error");
    }, 1500);
  } else {
    // Pure milk: slight yellow-brown tinge only
    animateColorChange(mat, new Color3(0.95, 0.95, 0.9), new Color3(0.7, 0.6, 0.2), 60, scene);
    tube.result = "NEGATIVE - No starch (yellow-brown color)";
    setTimeout(() => {
      showNotification("🟡 Yellow-brown = No starch. Pure milk.", "success");
    }, 1500);
  }
}

// ── Smooth color animation over `frames` steps ──
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
    mat.alpha = 0.75 + t * 0.15;
    frame++;
  });
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}