"use client";

// components/exercise-library/exercise-hero-media.tsx
// The exercise hero picture with a "View in 3D" switch. The illustration stays
// the default and stays mounted (hidden) while 3D is open, so it never
// reloads. The 3D viewer, three.js and the model download only after a tap
// (warmed on mouse hover/focus). Browsers without WebGL, or with Save-Data on, never
// see the switch; server HTML never has it.

import { useCallback, useRef, useState, useSyncExternalStore, type ComponentType, type PointerEvent, type ReactNode } from "react";
import type { ExerciseBody3DProps } from "@/components/exercise-library/exercise-body-3d";
import { trackLibraryEvent } from "@/lib/analytics";
import { canUse3D, loadBodyModel } from "@/lib/body-model-loader";
import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";
import type { BodyView } from "@/lib/exercise-anatomy/types";

const loadViewer = () => import("@/components/exercise-library/exercise-body-3d");
const noSubscribe = () => () => {};
const noSupportOnServer = () => false;

interface Props {
  slug: string;
  title: string;
  main: MuscleKey[];
  helpers: MuscleKey[];
  view: BodyView;
  children: ReactNode;
}

export function ExerciseHeroMedia({ slug, title, main, helpers, view, children }: Props) {
  const supported = useSyncExternalStore(noSubscribe, canUse3D, noSupportOnServer);
  const [open, setOpen] = useState(false);
  const [Viewer, setViewer] = useState<ComponentType<ExerciseBody3DProps> | null>(null);
  const [failed, setFailed] = useState(false);
  // After the first tap, a remount of the switch (picture <-> 3D, loading ->
  // viewer, error -> picture) takes focus, so keyboard users never land on
  // <body>. It only does so when focus has nowhere else to be: the old switch
  // has already left the DOM, so focus is on <body> unless the patient moved
  // it. preventScroll stops a slow load pulling them back up the page.
  const wantFocus = useRef(false);
  const toggleRef = useCallback((el: HTMLButtonElement | null) => {
    if (!el || !wantFocus.current) return;
    const active = document.activeElement;
    if (!active || active === document.body) el.focus({ preventScroll: true });
  }, []);
  // Which "View in 3D" tap a late viewer failure belongs to; going back to the picture retires it.
  const attempt = useRef(0);

  const warm = () => {
    loadBodyModel().catch(() => {});
    loadViewer().catch(() => {});
  };
  // On touch screens pointerenter fires at touchstart, so a scroll that merely
  // starts on the switch would download the model. Warm for a real mouse only.
  const warmOnHover = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") warm();
  };
  const fail = () => {
    setOpen(false);
    setFailed(true);
  };
  const show = () => {
    const id = ++attempt.current;
    wantFocus.current = true;
    setFailed(false);
    setOpen(true);
    trackLibraryEvent("library_3d_view", slug);
    loadViewer()
      .then((m) => setViewer(() => m.ExerciseBody3D))
      .catch(() => {
        if (attempt.current === id) fail();
      });
  };
  const hide = () => {
    attempt.current++;
    wantFocus.current = true;
    setOpen(false);
  };

  const toggle = supported ? (
    <button
      ref={toggleRef}
      type="button"
      className="exlib-hero-media__toggle"
      onClick={open ? hide : show}
      onPointerEnter={open || failed ? undefined : warmOnHover}
      onFocus={open || failed ? undefined : warm}
    >
      {open ? "Back to picture" : "View in 3D"}
    </button>
  ) : null;

  return (
    <div className="exlib-hero-media">
      <div className="exlib-hero-media__frame">
        <div hidden={open}>{children}</div>
        {!open ? toggle : null}
        {open && Viewer ? <Viewer title={title} main={main} helpers={helpers} view={view} corner={toggle} onError={fail} /> : null}
        {open && !Viewer ? (
          <div className="exercise-body-3d__stage">
            <div className="body-chart-3d__loading">
              <span>Loading the 3D body…</span>
            </div>
            {toggle}
          </div>
        ) : null}
      </div>
      {/* Always mounted, so filling it is announced; empty, it takes no space. */}
      <p className="exlib-hero-media__note" role="status">
        {failed ? "The 3D view couldn't load, so here's the picture instead." : null}
      </p>
    </div>
  );
}
