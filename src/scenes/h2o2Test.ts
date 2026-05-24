import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TestTube } from "./labScene";
import { showNotification } from "./labScene";

export function runH2O2Test(tube: TestTube, scene: Scene): void {
  tube.reagentAdded = "H2SO4";

  // Unknown sample contains hydrogen peroxide
  const isAdulterated = true;

  showNotification("💧 Adding H₂SO₄ dropwise with Vanadium pentoxide...", "info");

  const mat = tube.material as StandardMaterial;

  if (isAdulterated) {
    // Animate: white → pink → deep pink/red (H2O2 positive)
    // Dropwise effect: color builds gradually
    let frame = 0;
    const FRAMES = 90;

    const observer = scene.onBeforeRenderObservable.add(() => {
      if (frame >= FRAMES) {
        scene.onBeforeRenderObservable.remove(observer);
        return;
      }
      const t = easeInOut(frame / FRAMES);
      mat.diffuseColor = Color3.Lerp(
        new Color3(0.95, 0.95, 0.9),
        new Color3(0.9, 0.15, 0.4),
        t
      );
      frame++;
    });

    tube.result = "POSITIVE - Hydrogen peroxide detected (pink/red color)";

    setTimeout(() => {
      showNotification("🩷 Pink/Red color = HYDROGEN PEROXIDE DETECTED!", "error");
    }, 2000);
  } else {
    tube.result = "NEGATIVE - No hydrogen peroxide (no color change)";
    setTimeout(() => {
      showNotification("✅ No color change = No H₂O₂. Pure milk.", "success");
    }, 2000);
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}