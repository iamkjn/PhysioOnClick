"use client";

// components/body-chart.tsx
// Anatomical body chart: a stylised skeleton underlay + interactive muscle
// regions (front / back). Muscle path data from the `body-muscles` package
// (Apache-2.0, Copyright 2024 Ivan Vulović). Every region is a keyboard-
// operable button with a hover/focus tooltip giving its plain and clinical
// names.

import { useMemo, useRef, useState } from "react";
import { FRONT_MUSCLES, BACK_MUSCLES } from "body-muscles";
import {
  BODY_REGIONS,
  REGION_MUSCLES,
  SOMEWHERE_ELSE,
  regionClinical,
  regionLabel,
  type ChartView,
} from "@/lib/body-chart";

interface Props {
  value: string[];
  onChange?: (next: string[]) => void;
  readOnly?: boolean;
  idPrefix?: string;
}

interface MusclePath {
  id: string;
  path: string;
}
const MUSCLE_PATH = new Map<string, string>(
  ([...FRONT_MUSCLES, ...BACK_MUSCLES] as MusclePath[]).map((m) => [m.id, m.path])
);

const VIEWBOX: Record<ChartView, string> = { front: "0 0 35 93", back: "37 0 35 93" };

export function BodyChart({ value, onChange, readOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const [showBones, setShowBones] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => new Set(value), [value]);

  const viewKey = view;
  const figureRegions = BODY_REGIONS.filter(
    (r) => (REGION_MUSCLES[r.key]?.[viewKey]?.length ?? 0) > 0
  );

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

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const chips = value.map((k) => ({ key: k, label: regionLabel(k) }));

  return (
    <div
      className={`body-chart${showBones ? " show-bones" : ""}`}
      ref={wrapRef}
      onMouseMove={onMove}
      data-view={view}
    >
      {!readOnly && (
        <div className="body-chart__toolbar">
          <div className="body-chart__views" role="group" aria-label="Body view">
            <button type="button" className="body-chart__view-btn" aria-pressed={view === "front"} onClick={() => setView("front")}>
              Front
            </button>
            <button type="button" className="body-chart__view-btn" aria-pressed={view === "back"} onClick={() => setView("back")}>
              Back
            </button>
          </div>
          <button
            type="button"
            className="body-chart__bones-btn"
            aria-pressed={showBones}
            onClick={() => setShowBones((b) => !b)}
          >
            {showBones ? "Hide bones" : "Show bones"}
          </button>
        </div>
      )}

      <div className="body-chart__figure">
        <svg className="body-chart__svg" viewBox={VIEWBOX[view]} role="group" aria-label={`Body chart, ${view} view`}>
          <Skeleton view={view} />

          <g className="body-chart__regions">
            {figureRegions.map((r) => {
              const ids = REGION_MUSCLES[r.key][viewKey] ?? [];
              const on = selected.has(r.key);
              return (
                <g
                  key={r.key}
                  id={`${idPrefix}-${r.key}`}
                  className={`body-chart__region${on ? " is-selected" : ""}`}
                  role="button"
                  aria-label={r.label}
                  aria-pressed={on}
                  tabIndex={readOnly ? -1 : 0}
                  onClick={() => toggle(r.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(r.key);
                    }
                  }}
                  onMouseEnter={() => setHover(r.key)}
                  onMouseLeave={() => setHover((h) => (h === r.key ? null : h))}
                  onFocus={() => setHover(r.key)}
                  onBlur={() => setHover((h) => (h === r.key ? null : h))}
                >
                  {ids.map((mid) => {
                    const d = MUSCLE_PATH.get(mid);
                    return d ? <path key={mid} d={d} /> : null;
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {hover && (
          <div
            className="body-chart__tooltip"
            role="status"
            style={tip ? { left: tip.x, top: tip.y } : { left: "50%", top: 8, transform: "translateX(-50%)" }}
          >
            <strong>{regionLabel(hover)}</strong>
            {regionClinical(hover) && <span>{regionClinical(hover)}</span>}
          </div>
        )}
      </div>

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
                <button type="button" aria-label={`Remove ${c.label}`} onClick={() => toggle(c.key)}>
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

// ── Stylised skeleton ──────────────────────────────────────────────────────
// Joint coordinates measured from the body-muscles figure so the bones
// register with the muscle regions. L / R are image-left / image-right.

interface Frame {
  cx: number;
  skull: [number, number];
  shoulderL: [number, number]; shoulderR: [number, number];
  elbowL: [number, number]; elbowR: [number, number];
  wristL: [number, number]; wristR: [number, number];
  hipL: [number, number]; hipR: [number, number];
  kneeL: [number, number]; kneeR: [number, number];
  ankleL: [number, number]; ankleR: [number, number];
  spineTop: number; spineBottom: number;
  ribcage: boolean;
}

const FRAMES: Record<ChartView, Frame> = {
  front: {
    cx: 16, skull: [16, 3.6],
    shoulderL: [22.5, 17], shoulderR: [9.5, 17],
    elbowL: [28.5, 30], elbowR: [3.5, 30],
    wristL: [27.5, 43], wristR: [4.5, 43],
    hipL: [19.5, 49], hipR: [12.5, 49],
    kneeL: [20, 66], kneeR: [12, 66],
    ankleL: [20, 86], ankleR: [12.5, 86],
    spineTop: 8, spineBottom: 46, ribcage: true,
  },
  back: {
    cx: 52.5, skull: [52.5, 5],
    shoulderL: [45.5, 17], shoulderR: [59.5, 17],
    elbowL: [42, 30], elbowR: [63, 30],
    wristL: [42, 43], wristR: [63, 43],
    hipL: [48.5, 49], hipR: [56.5, 49],
    kneeL: [49, 66], kneeR: [56, 66],
    ankleL: [50, 86], ankleR: [55, 86],
    spineTop: 9, spineBottom: 46, ribcage: false,
  },
};

function bone(a: [number, number], b: [number, number], key: string) {
  return <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
}

function Skeleton({ view }: { view: ChartView }) {
  const f = FRAMES[view];
  const [sx, sy] = f.skull;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  return (
    <g className="body-chart__skeleton" aria-hidden="true">
      {/* skull + jaw */}
      <ellipse cx={sx} cy={sy} rx={3.9} ry={4.3} />
      <path d={`M ${sx - 3} ${sy + 1} Q ${sx} ${sy + 5.5} ${sx + 3} ${sy + 1}`} fill="none" />

      {/* spine, segmented */}
      {Array.from({ length: Math.round((f.spineBottom - f.spineTop) / 2.2) }, (_, i) => {
        const y = f.spineTop + i * 2.2;
        const w = y < 15 ? 1.1 : y < 34 ? 1.6 : 2.1;
        return <rect key={i} x={f.cx - w / 2} y={y} width={w} height={1.4} rx={0.5} />;
      })}

      {/* clavicles (front) / scapulae (back) */}
      {f.ribcage ? (
        <>
          <path d={`M ${f.cx - 0.6} 15 Q ${(f.cx + f.shoulderL[0]) / 2} 14 ${f.shoulderL[0]} ${f.shoulderL[1]}`} fill="none" />
          <path d={`M ${f.cx + 0.6} 15 Q ${(f.cx + f.shoulderR[0]) / 2} 14 ${f.shoulderR[0]} ${f.shoulderR[1]}`} fill="none" />
          {/* sternum */}
          <rect x={f.cx - 0.9} y={15} width={1.8} height={13} rx={0.6} />
          {/* ribs */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 17.5 + i * 3;
            const r = 7.2 - i * 0.5;
            return (
              <g key={i}>
                <path d={`M ${f.cx - 0.8} ${y} Q ${f.cx - r} ${y + 1} ${f.cx - r + 1.2} ${y + 5}`} fill="none" />
                <path d={`M ${f.cx + 0.8} ${y} Q ${f.cx + r} ${y + 1} ${f.cx + r - 1.2} ${y + 5}`} fill="none" />
              </g>
            );
          })}
        </>
      ) : (
        <>
          <path d={`M ${f.cx - 1.5} 16.5 L ${f.shoulderL[0] - 1.5} 17 L ${f.cx - 2.5} 25 Z`} fill="none" />
          <path d={`M ${f.cx + 1.5} 16.5 L ${f.shoulderR[0] + 1.5} 17 L ${f.cx + 2.5} 25 Z`} fill="none" />
        </>
      )}

      {/* pelvis — iliac wings + sacrum + pubic rami */}
      <path
        d={`M ${f.hipR[0] - 1} ${f.spineBottom - 3}
            C ${f.hipR[0] - 4} ${f.spineBottom - 2} ${f.hipR[0] - 4} ${f.hipR[1] - 1} ${f.hipR[0]} ${f.hipR[1] + 1}
            L ${f.cx} ${f.hipR[1] + 2}
            L ${f.hipL[0]} ${f.hipL[1] + 1}
            C ${f.hipL[0] + 4} ${f.hipL[1] - 1} ${f.hipL[0] + 4} ${f.spineBottom - 2} ${f.hipL[0] + 1} ${f.spineBottom - 3}
            Q ${f.cx} ${f.spineBottom - 1} ${f.hipR[0] - 1} ${f.spineBottom - 3} Z`}
        fill="none"
      />
      <circle cx={f.hipL[0]} cy={f.hipL[1]} r={1.1} />
      <circle cx={f.hipR[0]} cy={f.hipR[1]} r={1.1} />

      {/* arms */}
      {bone(f.shoulderL, f.elbowL, "hL")}
      {bone(f.shoulderR, f.elbowR, "hR")}
      <circle cx={f.elbowL[0]} cy={f.elbowL[1]} r={1.1} />
      <circle cx={f.elbowR[0]} cy={f.elbowR[1]} r={1.1} />
      {bone([f.elbowL[0] - 0.6, f.elbowL[1]], [f.wristL[0] - 0.6, f.wristL[1]], "rL")}
      {bone([f.elbowL[0] + 0.6, f.elbowL[1]], [f.wristL[0] + 0.6, f.wristL[1]], "uL")}
      {bone([f.elbowR[0] - 0.6, f.elbowR[1]], [f.wristR[0] - 0.6, f.wristR[1]], "rR")}
      {bone([f.elbowR[0] + 0.6, f.elbowR[1]], [f.wristR[0] + 0.6, f.wristR[1]], "uR")}
      {/* hands: metacarpals fanning from the wrist */}
      {([f.wristL, f.wristR] as [number, number][]).map((w, wi) => {
        const dir = wi === 0 ? 1 : -1;
        return (
          <g key={`hand${wi}`}>
            {[0, 1, 2, 3, 4].map((k) => (
              <line
                key={k}
                x1={w[0]}
                y1={w[1] + 0.5}
                x2={w[0] + dir * (1.5 + k * 0.9)}
                y2={w[1] + 5 - (k === 4 ? 2 : k === 0 ? 1 : 0)}
              />
            ))}
          </g>
        );
      })}

      {/* legs */}
      {bone(f.hipL, f.kneeL, "fL")}
      {bone(f.hipR, f.kneeR, "fR")}
      <circle cx={f.kneeL[0]} cy={f.kneeL[1]} r={1.3} />
      <circle cx={f.kneeR[0]} cy={f.kneeR[1]} r={1.3} />
      {bone([f.kneeL[0] - 0.7, f.kneeL[1]], [f.ankleL[0] - 0.7, f.ankleL[1]], "tL")}
      {bone([f.kneeL[0] + 0.7, f.kneeL[1]], [f.ankleL[0] + 0.7, f.ankleL[1]], "fibL")}
      {bone([f.kneeR[0] - 0.7, f.kneeR[1]], [f.ankleR[0] - 0.7, f.ankleR[1]], "tR")}
      {bone([f.kneeR[0] + 0.7, f.kneeR[1]], [f.ankleR[0] + 0.7, f.ankleR[1]], "fibR")}
      {/* feet */}
      {([f.ankleL, f.ankleR] as [number, number][]).map((an, ai) => {
        const t = mid(an, an);
        return (
          <path
            key={`foot${ai}`}
            d={`M ${an[0] - 1.5} ${an[1] + 1} L ${t[0]} ${an[1] + 5.5} L ${an[0] + 1.5} ${an[1] + 1} Z`}
            fill="none"
          />
        );
      })}
    </g>
  );
}
