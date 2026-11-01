"use client";

// components/exercise-library/body-map-3d.tsx
// Opt-in 3D "tap where it hurts" picker for the "Where does it hurt?" section
// on /exercises. The area cards below stay the main, accessible route; this
// only adds a "Pick on a 3D body" button for browsers that can run WebGL (never
// in server HTML). Opening it lazy-loads booking's 3D chart (three.js + model)
// in single-select mode; a tap lights one region and offers links to the
// library areas that genuinely cover it (lib/exercise-library-3d-areas.ts) —
// it never navigates by itself. Any failure hides the 3D and leaves the cards.

import Link from "next/link";
import { useId, useRef, useState, useSyncExternalStore, type ComponentType, type PointerEvent } from "react";
import type { BodyChart3DProps } from "@/components/body-chart-3d";
import { trackLibraryEvent } from "@/lib/analytics";
import { regionLabel } from "@/lib/body-chart";
import { canUse3D, loadBodyModel } from "@/lib/body-model-loader";
import { areasForRegion } from "@/lib/exercise-library-3d-areas";

const loadChart = () => import("@/components/body-chart-3d");
const noSubscribe = () => () => {};
const noSupportOnServer = () => false;

export function BodyMap3D() {
  const supported = useSyncExternalStore(noSubscribe, canUse3D, noSupportOnServer);
  const [open, setOpen] = useState(false);
  const [Chart, setChart] = useState<ComponentType<BodyChart3DProps> | null>(null);
  const [failed, setFailed] = useState(false);
  const [region, setRegion] = useState<string | null>(null);
  // Which open a late chart-module failure belongs to; closing retires it.
  const attempt = useRef(0);
  const panelId = useId();

  if (!supported) return null;

  const warm = () => {
    loadBodyModel().catch(() => {});
    loadChart().catch(() => {});
  };
  // On touch screens pointerenter fires at touchstart, so only a real mouse warms.
  const warmOnHover = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") warm();
  };
  const close = () => {
    attempt.current++;
    setOpen(false);
    setRegion(null);
  };
  const fail = () => {
    close();
    setFailed(true);
  };
  const show = () => {
    const id = ++attempt.current;
    setFailed(false);
    setOpen(true);
    trackLibraryEvent("library_3d_picker_open", "exercises");
    loadChart()
      .then((m) => setChart(() => m.BodyChart3D))
      .catch(() => {
        if (attempt.current === id) fail();
      });
  };

  const areas = region ? areasForRegion(region) : [];

  return (
    <div className="exlib-bodymap-3d">
      <div className="exlib-bodymap-3d__bar">
        <button
          type="button"
          className="exlib-bodymap-3d__toggle"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={open ? close : show}
          onPointerEnter={open ? undefined : warmOnHover}
          onFocus={open ? undefined : warm}
        >
          {open ? "Hide 3D body" : "Pick on a 3D body"}
        </button>
      </div>
      {/* Always mounted, so filling it is announced; empty, it takes no space. */}
      <p className="exlib-bodymap-3d__note" role="status">
        {failed ? "The 3D body couldn't load. Pick from the areas below." : null}
      </p>

      {open ? (
        <div id={panelId} className="exlib-bodymap-3d__panel">
          <div className="exlib-bodymap-3d__chart">
            {Chart ? (
              <Chart single value={region ? [region] : []} onChange={(next) => setRegion(next[0] ?? null)} onError={fail} />
            ) : (
              <div className="body-chart-3d__stage">
                <div className="body-chart-3d__loading">
                  <span>Loading the 3D body…</span>
                </div>
              </div>
            )}
          </div>

          <div className="exlib-bodymap-3d__result">
            {region ? (
              <>
                <p className="exlib-bodymap-3d__region">{regionLabel(region)}</p>
                {areas.length ? (
                  <ul className="exlib-bodymap-3d__links">
                    {areas.map((area) => (
                      <li key={area.key}>
                        <Link
                          href={`/exercises/area/${area.key}`}
                          className="exlib-bodymap-3d__link"
                          onClick={() => trackLibraryEvent("library_3d_picker_area_click", area.key)}
                        >
                          See {area.label.charAt(0).toLowerCase() + area.label.slice(1)} exercises
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="exlib-bodymap-3d__fallback">
                    We don&apos;t have a set of exercises for this area yet. Pick from the areas below or{" "}
                    <Link href="/book">book an assessment</Link>.
                  </p>
                )}
              </>
            ) : (
              <p className="exlib-bodymap-3d__prompt">Tap where it hurts. Drag to turn the body.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
