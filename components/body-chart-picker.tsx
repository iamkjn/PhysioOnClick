"use client";

// components/body-chart-picker.tsx
// Shows the 3D body chart, falling back silently to the flat BodyChart when
// 3D can't run here (no WebGL, data saver on), the model fails to load, or it
// isn't ready within LOAD_TIMEOUT_MS. The "simple chart" button is also the
// keyboard and screen-reader route: when the patient asks for it, keyboard focus
// moves to the flat chart. Once on the flat chart a patient is never switched
// back mid-task, and that choice (by request or by fallback) is remembered for
// the browser session so it survives the chart unmounting between wizard steps.
// Both charts save the same area keys.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BodyChart } from "@/components/body-chart";
import { BodyChart3D } from "@/components/body-chart-3d";
import { canUse3D } from "@/lib/body-model-loader";

export const LOAD_TIMEOUT_MS = 10_000;

// Once a patient is on the flat chart (by choice, error or timeout) they stay
// there for the browser session, even when the wizard unmounts the chart
// between steps.
const FLAT_KEY = "physioonclick:body-chart-flat";

function prefersFlat(): boolean {
  try {
    return sessionStorage.getItem(FLAT_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberFlat(): void {
  try {
    sessionStorage.setItem(FLAT_KEY, "1");
  } catch {
    // Storage blocked (private mode etc.): the choice lasts for this mount only.
  }
}

const noSubscribe = () => () => {};
const show3D = () => canUse3D() && !prefersFlat();
const unknownOnServer = () => null;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function BodyChartPicker({ value, onChange }: Props) {
  // null while server-rendering/hydrating; the browser checks run client-side only.
  const supported = useSyncExternalStore<boolean | null>(noSubscribe, show3D, unknownOnServer);
  const [flat, setFlat] = useState(false);
  const [ready, setReady] = useState(false);
  const [focusFlat, setFocusFlat] = useState(false);
  const flatRef = useRef<HTMLDivElement>(null);

  const goFlat = (byUser: boolean) => {
    rememberFlat();
    setFlat(true);
    if (byUser) setFocusFlat(true);
  };

  useEffect(() => {
    if (!supported || flat || ready) return;
    const timer = window.setTimeout(() => goFlat(false), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [supported, flat, ready]);

  useEffect(() => {
    if (!focusFlat) return;
    flatRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [focusFlat]);

  if (supported === false || flat) {
    return (
      <div ref={flatRef} className="body-chart-picker">
        <BodyChart value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="body-chart-picker">
      <button type="button" className="body-chart-picker__simple" onClick={() => goFlat(true)}>
        Use simple chart instead
      </button>
      {supported ? (
        <BodyChart3D value={value} onChange={onChange} onReady={() => setReady(true)} onError={() => goFlat(false)} />
      ) : (
        <div className="body-chart-3d__stage" aria-hidden="true" />
      )}
    </div>
  );
}
