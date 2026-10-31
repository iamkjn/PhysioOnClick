// components/exercise-library/exercise-body-3d-stage.ts
// The three.js scene behind the exercise 3D view: the booking-chart body (plus
// the deep-structures add-on when the exercise needs it) with this exercise's
// muscles lit in the accent colours and everything else see-through, so deep
// muscles show. three.js arrives as an argument (as in
// components/body-chart-3d.tsx), so it only downloads after "View in 3D".

import type { Material, Mesh } from "three";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";
import { POSITION_SCALE, type ModelPart } from "@/lib/body-model-format";
import type { BodyModel } from "@/lib/body-model-loader";
import { computePartBoxes, pickChunk, type Vec3 } from "@/lib/body-model-pick";
import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";
import {
  ANATOMY_COLOURS,
  ROLE,
  displayPartName,
  drawGroups,
  fitDistance,
  partLabel,
  partRoles,
  subsetBoxes,
  unionBox,
} from "@/lib/exercise-anatomy/scene";
import type { BodyView } from "@/lib/exercise-anatomy/types";

type Three = typeof import("three");

const FOV = 30;
const TAP_SLOP_PX = 8;
const MARGIN = 0.25; // close-up: 25% of the lit box on every side
const MIN_FRAME = 0.35; // metres: never frame less than this, so the joint stays in view
const WHOLE = { y: 0.87, height: 1.85, width: 0.9 }; // the booking chart's full-body framing
// Azimuths: the body faces +Z and its left side is +X (as in components/body-chart-3d.tsx).
const AZIMUTH: Record<BodyView, number> = { front: 0, back: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 };

export interface AnatomyStageOptions {
  main: readonly MuscleKey[];
  helpers: readonly MuscleKey[];
  view: BodyView;
}

export interface AnatomyStageHandlers {
  onTap(label: string | null): void;
  onContextLost(): void;
  onRotate(): void;
}

export interface AnatomyStage {
  setView(view: BodyView): void;
  setWholeBody(whole: boolean): void;
  dispose(): void;
}

interface PickSet {
  positions: Int16Array;
  indices: Uint16Array;
  parts: ModelPart[];
  boxes: Float32Array;
  litParts: ModelPart[];
  litBoxes: Float32Array;
}

export function createAnatomyStage(
  THREE: Three,
  OrbitControls: typeof OrbitControlsType,
  host: HTMLDivElement,
  sources: readonly BodyModel[],
  options: AnatomyStageOptions,
  handlers: AnatomyStageHandlers
): AnatomyStage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  host.appendChild(canvas);

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.3));
    // Key light rides with the camera, so every view is lit the same way.
    const key = new THREE.DirectionalLight(0xfffaf4, 1.8);
    key.position.set(-1.5, 2.5, 1);
    camera.add(key);

    // Order matches MATERIAL in lib/exercise-anatomy/scene.ts. See-through
    // layers don't write depth, so the lit muscles show through them.
    const materials: Material[] = [
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.main, roughness: 0.55, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.helper, roughness: 0.6, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.muscle, roughness: 0.7, transparent: true, opacity: 0.12, depthWrite: false }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.bone, roughness: 0.7, transparent: true, opacity: 0.3, depthWrite: false }),
    ];

    const meshes: Mesh[] = [];
    const pickSets: PickSet[] = [];
    const mainBoxes: [Float32Array, number][] = [];
    for (const source of sources) {
      const { manifest } = source;
      source.chunks.forEach((chunk, i) => {
        const parts = manifest.parts.filter((p) => p.chunk === i);
        const roles = partRoles(parts, options.main, options.helpers);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3, true));
        geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3, true));
        geometry.setIndex(new THREE.BufferAttribute(chunk.indices, 1));
        for (const g of drawGroups(parts, roles, manifest.systems)) geometry.addGroup(g.start, g.count, g.materialIndex);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.scale.setScalar(POSITION_SCALE);
        scene.add(mesh);
        meshes.push(mesh);

        const boxes = computePartBoxes(chunk.positions, parts);
        const lit: number[] = [];
        roles.forEach((role, p) => {
          if (role !== ROLE.other) lit.push(p);
          if (role === ROLE.main) mainBoxes.push([boxes, p]);
        });
        pickSets.push({
          positions: chunk.positions,
          indices: chunk.indices,
          parts,
          boxes,
          litParts: lit.map((p) => parts[p]),
          litBoxes: subsetBoxes(boxes, lit),
        });
      });
    }

    // Close-up frames the main muscles (both sides); whole body matches the booking chart.
    const litBox = unionBox(mainBoxes);
    const close = litBox
      ? {
          target: new THREE.Vector3(
            ((litBox[0] + litBox[3]) / 2) * POSITION_SCALE,
            ((litBox[1] + litBox[4]) / 2) * POSITION_SCALE,
            ((litBox[2] + litBox[5]) / 2) * POSITION_SCALE
          ),
          height: Math.max(MIN_FRAME, (litBox[4] - litBox[1]) * POSITION_SCALE),
          width: Math.max(MIN_FRAME, Math.max(litBox[3] - litBox[0], litBox[5] - litBox[2]) * POSITION_SCALE),
          margin: MARGIN,
        }
      : null;
    const whole = { target: new THREE.Vector3(0, WHOLE.y, 0), height: WHOLE.height, width: WHOLE.width, margin: 0 };
    let wholeBody = close === null;

    let frame = 0;
    const render = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderer.render(scene, camera);
      });
    };

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.42;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.rotateSpeed = 0.7;
    controls.addEventListener("change", render);
    // A drag by the patient (not our own setView) means no preset view is active.
    let dragging = false;
    controls.addEventListener("start", () => {
      dragging = true;
    });
    controls.addEventListener("end", () => {
      dragging = false;
    });
    controls.addEventListener("change", () => {
      if (dragging) handlers.onRotate();
    });
    // Vertical swipes keep scrolling the page; sideways drags turn the body.
    canvas.style.touchAction = "pan-y";

    const azimuthNow = () => Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
    const place = (azimuth: number) => {
      const f = wholeBody || !close ? whole : close;
      controls.target.copy(f.target);
      const distance = fitDistance({ height: f.height, width: f.width }, FOV, camera.aspect, f.margin);
      camera.position.set(f.target.x + Math.sin(azimuth) * distance, f.target.y, f.target.z + Math.cos(azimuth) * distance);
      controls.update();
      render();
    };

    let placed = false;
    const fit = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      place(placed ? azimuthNow() : AZIMUTH[options.view]);
      placed = true;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pickIn = (origin: Vec3, dir: Vec3, litOnly: boolean): ModelPart | null => {
      let best: { part: ModelPart; distance: number } | null = null;
      for (const set of pickSets) {
        const parts = litOnly ? set.litParts : set.parts;
        const boxes = litOnly ? set.litBoxes : set.boxes;
        if (!parts.length) continue;
        const hit = pickChunk(origin, dir, set.positions, set.indices, parts, boxes, best?.distance);
        if (hit) best = { part: parts[hit.part], distance: hit.distance };
      }
      return best?.part ?? null;
    };
    const tapLabel = (clientX: number, clientY: number): string | null => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      // Every mesh shares one transform (uniform scale POSITION_SCALE), so one
      // local-space ray serves them all and distances compare directly.
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      const origin: Vec3 = [o.x / POSITION_SCALE, o.y / POSITION_SCALE, o.z / POSITION_SCALE];
      const dir: Vec3 = [d.x, d.y, d.z];
      // Lit parts first, so a tap names the highlighted muscle even under see-through layers.
      const lit = pickIn(origin, dir, true);
      if (lit) return partLabel(lit.name, options.main, options.helpers);
      const any = pickIn(origin, dir, false);
      return any ? displayPartName(any.name) : null;
    };

    let down: { x: number; y: number; id: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      down = e.button === 0 && e.isPrimary ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved <= TAP_SLOP_PX) handlers.onTap(tapLabel(e.clientX, e.clientY));
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      handlers.onContextLost();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return {
      setView(view) {
        place(AZIMUTH[view]);
      },
      setWholeBody(next) {
        wholeBody = next || !close;
        place(azimuthNow());
      },
      dispose() {
        observer.disconnect();
        if (frame) cancelAnimationFrame(frame);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        controls.dispose();
        meshes.forEach((m) => m.geometry.dispose());
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    throw error;
  }
}
