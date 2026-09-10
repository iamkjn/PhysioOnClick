"use client";

// components/body-chart.tsx
// Clickable SVG body chart for the assessment wizard. Front/back silhouette
// with tappable regions. Orientation is "selfie / mirror": the patient's LEFT
// is on the LEFT of the image in both views, which is the most intuitive for
// someone tapping their own body. Region keys come from lib/body-chart.ts.

import { useMemo, useState } from "react";
import {
  BODY_REGIONS,
  SOMEWHERE_ELSE,
  regionLabel,
  type ChartView,
} from "@/lib/body-chart";

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// One ellipse per view. "both"-view regions reuse `front` for the back too.
const SHAPES: Record<string, { front?: Ellipse; back?: Ellipse }> = {
  neck: { front: { cx: 110, cy: 54, rx: 12, ry: 11 }, back: { cx: 110, cy: 54, rx: 12, ry: 11 } },
  chest: { front: { cx: 110, cy: 100, rx: 32, ry: 24 } },
  "upper-back": { back: { cx: 110, cy: 96, rx: 30, ry: 22 } },
  "lower-back": { back: { cx: 110, cy: 150, rx: 26, ry: 24 } },
  "shoulder-left": ellipseBoth(72, 74, 15, 13),
  "shoulder-right": ellipseBoth(148, 74, 15, 13),
  "upper-arm-left": ellipseBoth(55, 110, 11, 26),
  "upper-arm-right": ellipseBoth(165, 110, 11, 26),
  "elbow-hand-left": ellipseBoth(52, 168, 10, 36),
  "elbow-hand-right": ellipseBoth(168, 168, 10, 36),
  "hip-left": ellipseBoth(88, 182, 16, 15),
  "hip-right": ellipseBoth(132, 182, 16, 15),
  "thigh-left": ellipseBoth(90, 240, 15, 42),
  "thigh-right": ellipseBoth(130, 240, 15, 42),
  "knee-left": ellipseBoth(91, 300, 13, 13),
  "knee-right": ellipseBoth(129, 300, 13, 13),
  "lower-leg-left": ellipseBoth(91, 345, 12, 40),
  "lower-leg-right": ellipseBoth(129, 345, 12, 40),
  "ankle-foot-left": ellipseBoth(92, 400, 13, 14),
  "ankle-foot-right": ellipseBoth(128, 400, 13, 14),
};

function ellipseBoth(cx: number, cy: number, rx: number, ry: number) {
  const e = { cx, cy, rx, ry };
  return { front: e, back: e };
}

interface Props {
  value: string[];
  onChange?: (next: string[]) => void;
  readOnly?: boolean;
  idPrefix?: string;
}

export function BodyChart({ value, onChange, readOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const selected = useMemo(() => new Set(value), [value]);

  function toggle(key: string) {
    if (readOnly || !onChange) return;
    if (key === SOMEWHERE_ELSE) {
      onChange(selected.has(SOMEWHERE_ELSE) ? [] : [SOMEWHERE_ELSE]);
      return;
    }
    const next = new Set(value.filter((k) => k !== SOMEWHERE_ELSE));
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  }

  const visible = BODY_REGIONS.filter((r) => r.view === "both" || r.view === view);
  const chips = value.map((k) => ({ key: k, label: regionLabel(k) }));

  return (
    <div className="body-chart" data-view={view}>
      {!readOnly && (
        <div className="body-chart__views" role="group" aria-label="Body view">
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "front"} onClick={() => setView("front")}>
            Front view
          </button>
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "back"} onClick={() => setView("back")}>
            Back view
          </button>
        </div>
      )}

      <svg className="body-chart__svg" viewBox="0 0 220 460" role="group" aria-label={`Body chart, ${view} view`}>
        <g className="body-chart__silhouette" aria-hidden="true">
          <circle cx="110" cy="30" r="19" />
          <rect x="100" y="46" width="20" height="14" />
          <path d="M70 62 Q110 54 150 62 L156 152 Q110 168 64 152 Z" />
          <rect x="45" y="66" width="18" height="70" rx="9" />
          <rect x="157" y="66" width="18" height="70" rx="9" />
          <rect x="43" y="130" width="16" height="80" rx="8" />
          <rect x="161" y="130" width="16" height="80" rx="8" />
          <path d="M64 150 Q110 170 156 150 L150 198 Q110 210 70 198 Z" />
          <rect x="75" y="196" width="26" height="100" rx="13" />
          <rect x="119" y="196" width="26" height="100" rx="13" />
          <rect x="79" y="292" width="22" height="104" rx="11" />
          <rect x="119" y="292" width="22" height="104" rx="11" />
          <ellipse cx="90" cy="404" rx="16" ry="9" />
          <ellipse cx="130" cy="404" rx="16" ry="9" />
        </g>

        <g className="body-chart__regions">
          {visible.map((r) => {
            const shape = SHAPES[r.key]?.[view];
            if (!shape) return null;
            const isOn = selected.has(r.key);
            return (
              <ellipse
                key={r.key}
                id={`${idPrefix}-${r.key}`}
                className={`body-chart__region${isOn ? " is-selected" : ""}`}
                cx={shape.cx}
                cy={shape.cy}
                rx={shape.rx}
                ry={shape.ry}
                role="button"
                aria-label={r.label}
                aria-pressed={isOn}
                tabIndex={readOnly ? -1 : 0}
                onClick={() => toggle(r.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(r.key);
                  }
                }}
              />
            );
          })}
        </g>
      </svg>

      {!readOnly && (
        <button
          type="button"
          className="body-chart__elsewhere"
          aria-pressed={selected.has(SOMEWHERE_ELSE)}
          onClick={() => toggle(SOMEWHERE_ELSE)}
        >
          Somewhere else / not sure
        </button>
      )}

      {chips.length > 0 && (
        <ul className="body-chart__chips" aria-label="Selected areas">
          {chips.map((c) => (
            <li key={c.key} className="body-chart__chip">
              {c.label}
              {!readOnly && (
                <button
                  type="button"
                  aria-label={`Remove ${c.label}`}
                  onClick={() => toggle(c.key)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
