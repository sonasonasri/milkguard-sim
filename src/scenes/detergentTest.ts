import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TestTube } from "./labScene";
import { showNotification } from "./labScene";

export function runDetergentTest(tube: TestTube, scene: Scene): void {
  tube.reagentAdded = "Soap";

  // Unknown sample contains detergent → persistent foam
  const isAdulterated = true;

  showNotification("🫧 Shaking tube... observe foam!", "info");

  // Shake animation
  const originalPos = tube.mesh.position.clone();
  let shakeFrame = 0;
  const shakeObserver = scene.onBeforeRenderObservable.add(() => {
    if (shakeFrame >= 60) {
      scene.onBeforeRenderObservable.remove(shakeObserver);
      tube.mesh.position = originalPos;
      if (isAdulterated) spawnFoam(tube, scene);
      return;
    }
    tube.mesh.position.x = originalPos.x + Math.sin(shakeFrame * 0.8) * 0.15;
    tube.mesh.position.y = originalPos.y + Math.abs(Math.sin(shakeFrame * 0.5)) * 0.1;
    shakeFrame++;
  });

  if (isAdulterated) {
    tube.result = "POSITIVE - Detergent detected (persistent foam layer)";
    setTimeout(() => {
      showNotification("🫧 Persistent foam = DETERGENT DETECTED!", "error");
    }, 2500);
  } else {
    tube.result = "NEGATIVE - No detergent (foam disappears quickly)";
    setTimeout(() => {
      showNotification("✅ No persistent foam = Pure milk.", "success");
    }, 2500);
  }
}

function spawnFoam(tube: TestTube, scene: Scene): void {
  // Foam cap above tube
  const foamCap = MeshBuilder.CreateCylinder(
    "foamCap",
    { height: 0.3, diameter: 0.34, tessellation: 16 },
    scene
  );
  foamCap.position = new Vector3(
    tube.mesh.position.x,
    tube.mesh.position.y + 1.05,
    tube.mesh.position.z
  );
  const foamMat = new StandardMaterial("foamMat", scene);
  foamMat.diffuseColor = new Color3(1, 1, 1);
  foamMat.alpha = 0.85;
  foamCap.material = foamMat;

  // Bubble particle system
  const bubbles = new ParticleSystem("bubbles", 80, scene);
  bubbles.emitter = foamCap;
  bubbles.minEmitBox = new Vector3(-0.15, 0, -0.15);
  bubbles.maxEmitBox = new Vector3(0.15, 0.1, 0.15);

  bubbles.color1 = new Color4(1, 1, 1, 0.9);
  bubbles.color2 = new Color4(0.85, 0.95, 1, 0.6);
  bubbles.colorDead = new Color4(1, 1, 1, 0);

  bubbles.minSize = 0.02;
  bubbles.maxSize = 0.07;
  bubbles.minLifeTime = 1.5;
  bubbles.maxLifeTime = 3.0;
  bubbles.emitRate = 30;

  bubbles.direction1 = new Vector3(-0.05, 0.15, -0.05);
  bubbles.direction2 = new Vector3(0.05, 0.3, 0.05);
  bubbles.minEmitPower = 0.05;
  bubbles.maxEmitPower = 0.15;
  bubbles.updateSpeed = 0.01;

  bubbles.start();

  // Foam persists (detergent present) — stop after 8 seconds
  setTimeout(() => {
    bubbles.stop();
  }, 8000);
}