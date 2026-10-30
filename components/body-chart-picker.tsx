"use client";

// components/body-chart-picker.tsx
// Shows the 3D body chart, falling back silently to the flat BodyChart when
// 3D can't run here (no WebGL, data saver on), the model fails to load, or it
// isn't ready within LOAD_TIMEOUT_MS. The "simple chart" link is also the
// keyboard and screen-reader route. Once on the flat chart a patient is never
// switched back mid-task. Both charts save the same area keys.

import { useEffect, useState, useSyncExternalStore } from "react";
import { BodyChart } from "@/components/body-chart";
import { BodyChart3D } from "@/components/body-chart-3d";
import { canUse3D } from "@/lib/body-model-loader";

export const LOAD_TIMEOUT_MS = 10_000;

const noSubscribe = () => () => {};
const unknownOnServer = () => null;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function BodyChartPicker({ value, onChange }: Props) {
  // null while server-rendering/hydrating; the browser check runs client-side only.
  const supported = useSyncExternalStore<boolean | null>(noSubscribe, canUse3D, unknownOnServer);
  const [flat, setFlat] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supported || flat || ready) return;
    const timer = window.setTimeout(() => setFlat(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [supported, flat, ready]);

  if (supported === false || flat) return <BodyChart value={value} onChange={onChange} />;

  return (
    <div className="body-chart-picker">
      <button type="button" className="body-chart-picker__simple" onClick={() => setFlat(true)}>
        Use simple chart instead
      </button>
      {supported ? (
        <BodyChart3D value={value} onChange={onChange} onReady={() => setReady(true)} onError={() => setFlat(true)} />
      ) : (
        <div className="body-chart-3d__stage" aria-hidden="true" />
      )}
    </div>
  );
}
