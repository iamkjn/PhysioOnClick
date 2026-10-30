"use client";

// components/body-chart-3d.tsx
// Rotatable 3D body (BodyParts3D muscles over skeleton) for marking where it
// hurts. Every vertex carries one of the 31 areas from lib/body-chart.ts
// (baked in by scripts/build-body-model.ts), so a tap selects the area under
// the finger and the whole area is tinted — same saved keys as the flat chart.
// three.js is imported inside the effect so it only downloads on this step.
// Fallback and the accessible route live in components/body-chart-picker.tsx.

import { useEffect, useRef, useState } from "react";
import type { BufferAttribute, Mesh } from "three";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";
import { BodyChartSelection } from "@/components/body-chart-selection";
import { regionLabel, toggleRegion } from "@/lib/body-chart";
import { loadBodyModel, onBodyModelProgress, type BodyModel } from "@/lib/body-model-loader";
import {
  NO_REGION,
  POSITION_SCALE,
  baseColors,
  paintColors,
  partForFace,
  type ModelPart,
} from "@/lib/body-model-format";

type Three = typeof import("three");
type View = "front" | "back" | "left" | "right";

// Azimuths: the body faces +Z and its left side is +X.
const VIEWS: { id: View; label: string; aria: string; azimuth: number }[] = [
  { id: "front", label: "Front", aria: "Front view", azimuth: 0 },
  { id: "back", label: "Back", aria: "Back view", azimuth: Math.PI },
  { id: "left", label: "Left", aria: "Your left side", azimuth: Math.PI / 2 },
  { id: "right", label: "Right", aria: "Your right side", azimuth: -Math.PI / 2 },
];
const TARGET_Y = 0.87; // metres, about mid-height
const FRAME_HEIGHT = 1.85; // metres: body plus headroom
const FRAME_WIDTH = 0.9; // metres: arms at rest
const FOV = 30;
const TAP_SLOP_PX = 8;
const HOVER_THROTTLE_MS = 80;

interface Hit {
  region: number;
  part: ModelPart | undefined;
}

interface Stage {
  setView(view: View): void;
  paint(selected: ReadonlySet<number>, hover: number | null): void;
  dispose(): void;
}

interface Handlers {
  onTap(hit: Hit): void;
  onHover(hit: Hit | null): void;
  onContextLost(): void;
  onRotate(): void;
}

function displayName(part: ModelPart | undefined): string {
  if (!part) return "";
  const name = part.name.replace(/\b(left|right)\b ?/gi, "").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function createStage(
  THREE: Three,
  OrbitControls: typeof OrbitControlsType,
  host: HTMLDivElement,
  model: BodyModel,
  handlers: Handlers
): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  host.appendChild(canvas);

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
    camera.position.set(0, TARGET_Y, 4);
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.3));
    // Key light rides with the camera, so every view is lit the same way.
    const key = new THREE.DirectionalLight(0xfffaf4, 1.8);
    key.position.set(-1.5, 2.5, 1);
    camera.add(key);

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.04 });
    const partsByChunk = model.manifest.chunks.map((_, i) => model.manifest.parts.filter((p) => p.chunk === i));
    const meshes: Mesh[] = [];
    const colourData: { attr: BufferAttribute; colors: Uint8Array; base: Uint8Array; regions: Uint8Array }[] = [];
    model.chunks.forEach((chunk, i) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3, true));
      geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3, true));
      const base = baseColors(partsByChunk[i], model.manifest.systems, chunk.regions.length);
      const colors = base.slice();
      const attr = new THREE.BufferAttribute(colors, 3, true);
      geometry.setAttribute("color", attr);
      geometry.setIndex(new THREE.BufferAttribute(chunk.indices, 1));
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(POSITION_SCALE);
      mesh.userData.chunk = i;
      scene.add(mesh);
      meshes.push(mesh);
      colourData.push({ attr, colors, base, regions: chunk.regions });
    });

    let frame = 0;
    const render = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderer.render(scene, camera);
      });
    };

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, TARGET_Y, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.42;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.rotateSpeed = 0.7;
    controls.addEventListener("change", render);
    // A drag by the patient (not our own setView/fit) means no preset view is active.
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

    let distance = 4;
    const fit = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      distance = Math.max(FRAME_HEIGHT / 2 / tanHalf, FRAME_WIDTH / 2 / (tanHalf * camera.aspect));
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, distance);
      camera.updateProjectionMatrix();
      controls.update();
      render();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const nearest = new THREE.Vector3();
    const pick = (clientX: number, clientY: number): Hit | null => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit?.face || hit.faceIndex == null) return null;
      const i = hit.object.userData.chunk as number;
      // Long simplified triangles can straddle an area boundary: use the corner
      // nearest the hit point rather than always the first one.
      const local = hit.object.worldToLocal(hit.point.clone());
      const position = (hit.object as Mesh).geometry.getAttribute("position");
      let vertex = hit.face.a;
      let best = Infinity;
      for (const corner of [hit.face.a, hit.face.b, hit.face.c]) {
        const d = nearest.fromBufferAttribute(position, corner).distanceToSquared(local);
        if (d < best) {
          best = d;
          vertex = corner;
        }
      }
      const region = colourData[i].regions[vertex];
      if (region === NO_REGION) return null;
      return { region, part: partForFace(partsByChunk[i], hit.faceIndex) };
    };

    let down: { x: number; y: number; id: number } | null = null;
    let hoverTimer = 0;
    const onPointerDown = (e: PointerEvent) => {
      down = e.button === 0 && e.isPrimary ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > TAP_SLOP_PX) return;
      const hit = pick(e.clientX, e.clientY);
      if (hit) handlers.onTap(hit);
    };
    let lastHover: { x: number; y: number } | null = null;
    // At most one pick per HOVER_THROTTLE_MS: a pick on the leading edge, then one
    // trailing pick per window while the mouse keeps moving.
    const scheduleHoverWindow = () => {
      hoverTimer = window.setTimeout(() => {
        hoverTimer = 0;
        if (!lastHover) return;
        const { x, y } = lastHover;
        lastHover = null;
        handlers.onHover(pick(x, y));
        scheduleHoverWindow();
      }, HOVER_THROTTLE_MS);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons) return;
      lastHover = { x: e.clientX, y: e.clientY };
      if (hoverTimer) return;
      lastHover = null;
      handlers.onHover(pick(e.clientX, e.clientY));
      scheduleHoverWindow();
    };
    const onPointerLeave = () => {
      lastHover = null;
      handlers.onHover(null);
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      handlers.onContextLost();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return {
      setView(view) {
        const azimuth = VIEWS.find((v) => v.id === view)?.azimuth ?? 0;
        camera.position.set(
          controls.target.x + Math.sin(azimuth) * distance,
          controls.target.y,
          controls.target.z + Math.cos(azimuth) * distance
        );
        controls.update();
        render();
      },
      paint(selected, hover) {
        for (const d of colourData) {
          paintColors(d.colors, d.base, d.regions, selected, hover);
          d.attr.needsUpdate = true;
        }
        render();
      },
      dispose() {
        observer.disconnect();
        if (frame) cancelAnimationFrame(frame);
        window.clearTimeout(hoverTimer);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        controls.dispose();
        meshes.forEach((m) => m.geometry.dispose());
        material.dispose();
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

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  onReady?: () => void;
  onError?: () => void;
}

export function BodyChart3D({ value, onChange, onReady, onError }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Stage | null>(null);
  const latest = useRef({ value, onChange, onReady, onError });
  const [regions, setRegions] = useState<string[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<View | null>("front");
  const [hover, setHover] = useState<Hit | null>(null);
  const [tip, setTip] = useState<Hit | null>(null);
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    latest.current = { value, onChange, onReady, onError };
  });

  useEffect(() => onBodyModelProgress((loaded, total) => setProgress(total ? loaded / total : 0)), []);

  useEffect(() => {
    let disposed = false;
    let stage: Stage | null = null;
    (async () => {
      try {
        const [THREE, { OrbitControls }, model] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          loadBodyModel(),
        ]);
        const host = stageRef.current;
        if (disposed || !host) return;
        stage = createStage(THREE, OrbitControls, host, model, {
          onTap(hit) {
            const key = model.manifest.regions[hit.region];
            const next = toggleRegion(latest.current.value, key);
            latest.current.onChange(next);
            setTip(next.includes(key) ? hit : null);
            setAnnounce(`${regionLabel(key)} ${next.includes(key) ? "selected" : "removed"}`);
          },
          onHover(hit) {
            setHover((prev) => (prev?.region === hit?.region && prev?.part === hit?.part ? prev : hit));
          },
          onContextLost() {
            latest.current.onError?.();
          },
          onRotate() {
            setView(null);
          },
        });
        apiRef.current = stage;
        setRegions(model.manifest.regions);
        latest.current.onReady?.();
      } catch (error) {
        console.error("3D body chart failed to load", error);
        if (!disposed) latest.current.onError?.();
      }
    })();
    return () => {
      disposed = true;
      stage?.dispose();
      apiRef.current = null;
    };
  }, []);

  const hoverRegion = hover?.region ?? null;
  useEffect(() => {
    if (!regions) return;
    const index = new Map(regions.map((k, i) => [k, i]));
    const selected = new Set(value.map((k) => index.get(k)).filter((i): i is number => i !== undefined));
    apiRef.current?.paint(selected, hoverRegion);
  }, [regions, value, hoverRegion]);

  // The last-tapped tooltip only stays while its area is still selected (it may
  // have been removed via its chip or "Somewhere else").
  const tipStillSelected = tip !== null && regions !== null && value.includes(regions[tip.region]);
  const shown = hover ?? (tipStillSelected ? tip : null);

  return (
    <div className="body-chart body-chart-3d">
      <div className="body-chart__toolbar">
        <div className="body-chart__views" role="group" aria-label="Body view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="body-chart__view-btn"
              aria-pressed={view === v.id}
              aria-label={v.aria}
              disabled={!regions}
              onClick={() => {
                apiRef.current?.setView(v.id);
                setView(v.id);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        className="body-chart-3d__stage"
        role="img"
        aria-label="3D body. Drag sideways to turn it, and tap where you feel it."
      >
        {!regions && (
          <div className="body-chart-3d__loading">
            <span>Loading the 3D body…</span>
            <progress max={1} value={progress} />
          </div>
        )}
      </div>

      <p className="body-chart-3d__hint">Drag sideways to turn the body. Tap where you feel it.</p>

      {shown && regions ? (
        <div className="body-chart__tooltip">
          <strong>{regionLabel(regions[shown.region])}</strong>
          {shown.part ? <span>{displayName(shown.part)}</span> : null}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <BodyChartSelection value={value} onToggle={(key) => onChange(toggleRegion(value, key))} />

      <p className="body-chart-3d__credit">
        Anatomy adapted from BodyParts3D © DBCLS,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>{" "}
        ·{" "}
        <a href="/models/body-chart/ATTRIBUTION.md" target="_blank" rel="noopener noreferrer">
          licence details
        </a>
      </p>
    </div>
  );
}
