"use client";

// components/exercise-library/exercise-body-3d.tsx
// The exercise page's 3D view: the live body model with this exercise's main
// muscles and helpers lit, Front/Back/Left/Right, a close-up/whole-body
// switch, tap-to-name, a legend and any "approximate" notes. Loaded with
// import() from exercise-hero-media.tsx only after "View in 3D", and it
// imports three.js and the scene the same lazy way.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnatomyStage } from "@/components/exercise-library/exercise-body-3d-stage";
import { loadBodyModel, onBodyModelProgress } from "@/lib/body-model-loader";
import { loadAnatomyAddon } from "@/lib/exercise-anatomy/addon-loader";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";
import { needsAddon, standInNotes } from "@/lib/exercise-anatomy/scene";
import type { BodyView } from "@/lib/exercise-anatomy/types";

const VIEWS: { id: BodyView; label: string; aria: string }[] = [
  { id: "front", label: "Front", aria: "Front view" },
  { id: "back", label: "Back", aria: "Back view" },
  { id: "left", label: "Left", aria: "Your left side" },
  { id: "right", label: "Right", aria: "Your right side" },
];

function joinList(items: readonly string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export interface ExerciseBody3DProps {
  title: string;
  main: MuscleKey[];
  helpers: MuscleKey[];
  view: BodyView;
  /** Rendered inside the stage's corner (the "Back to picture" button). */
  corner?: ReactNode;
  onError(): void;
}

export function ExerciseBody3D({ title, main, helpers, view: startView, corner, onError }: ExerciseBody3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AnatomyStage | null>(null);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<BodyView | null>(startView);
  const [whole, setWhole] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => onBodyModelProgress((loaded, total) => setProgress(total ? loaded / total : 0)), []);

  useEffect(() => {
    let disposed = false;
    let stage: AnatomyStage | null = null;
    (async () => {
      try {
        const [THREE, { OrbitControls }, { createAnatomyStage }, base, addon] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("@/components/exercise-library/exercise-body-3d-stage"),
          loadBodyModel(),
          needsAddon([...main, ...helpers]) ? loadAnatomyAddon() : Promise.resolve(null),
        ]);
        const host = stageRef.current;
        if (disposed || !host) return;
        stage = createAnatomyStage(THREE, OrbitControls, host, addon ? [base, addon] : [base], { main, helpers, view: startView }, {
          onTap: setTip,
          onContextLost: () => onErrorRef.current(),
          onRotate: () => setView(null),
        });
        apiRef.current = stage;
        setReady(true);
      } catch (error) {
        console.error("Exercise 3D view failed to load", error);
        if (!disposed) onErrorRef.current();
      }
    })();
    return () => {
      disposed = true;
      stage?.dispose();
      apiRef.current = null;
    };
    // The muscles and starting side are fixed for a page; the scene is built once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainLabels = main.map((k) => MUSCLES[k].label);
  const helperLabels = helpers.map((k) => MUSCLES[k].label);
  const notes = standInNotes([...main, ...helpers]);
  const label =
    `3D body for ${title}, showing ${joinList(mainLabels)} as the main focus` +
    (helperLabels.length ? ` with ${joinList(helperLabels)} helping` : "") +
    ". Drag sideways to turn it all the way round.";

  return (
    <div className="exercise-body-3d">
      <div ref={stageRef} className="exercise-body-3d__stage" role="img" aria-label={label}>
        {!ready && (
          <div className="body-chart-3d__loading">
            <span>Loading the 3D body…</span>
            <progress max={1} value={progress} />
          </div>
        )}
        {ready ? (
          <div className="body-chart-3d__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 4v5h-5" />
            </svg>
            <span>
              <strong>360°</strong>
              <span>Drag to turn</span>
            </span>
          </div>
        ) : null}
        {corner}
      </div>

      <div className="exercise-body-3d__controls">
        <div className="body-chart__views" role="group" aria-label="Body view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="body-chart__view-btn"
              aria-pressed={view === v.id}
              aria-label={v.aria}
              disabled={!ready}
              onClick={() => {
                apiRef.current?.setView(v.id);
                setView(v.id);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="exercise-body-3d__zoom"
          disabled={!ready}
          onClick={() => {
            apiRef.current?.setWholeBody(!whole);
            setWhole(!whole);
          }}
        >
          {whole ? "Close-up" : "Whole body"}
        </button>
      </div>

      <p className="exercise-body-3d__tip" aria-live="polite">
        {tip ?? ""}
      </p>

      <ul className="exercise-body-3d__legend">
        <li>
          <span className="exercise-body-3d__swatch exercise-body-3d__swatch--main" aria-hidden="true" />
          Main focus
        </li>
        {helpers.length ? (
          <li>
            <span className="exercise-body-3d__swatch exercise-body-3d__swatch--helper" aria-hidden="true" />
            Helpers
          </li>
        ) : null}
      </ul>
      {notes.map((note) => (
        <p key={note} className="exercise-body-3d__note">
          {note}
        </p>
      ))}

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
