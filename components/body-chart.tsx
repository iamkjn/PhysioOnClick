"use client";

// components/body-chart.tsx
// Anatomical body chart for the assessment wizard. Renders a front/back muscle
// figure from lib/body-chart-data.ts; each named region is a keyboard-operable
// button with a hover/focus tooltip giving its plain and clinical names.

import { useMemo, useRef, useState } from "react";
import {
  ANTERIOR_MUSCLES,
  POSTERIOR_MUSCLES,
  ANTERIOR_VIEWBOX,
  POSTERIOR_VIEWBOX,
} from "@/lib/body-chart-data";
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

const CHIP_REGIONS = BODY_REGIONS.filter((r) => r.chip);

export function BodyChart({ value, onChange, readOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => new Set(value), [value]);

  const muscleMap = view === "front" ? ANTERIOR_MUSCLES : POSTERIOR_MUSCLES;
  const viewBox = view === "front" ? ANTERIOR_VIEWBOX : POSTERIOR_VIEWBOX;
  const viewKey = view === "front" ? "anterior" : "posterior";

  const figureRegions = BODY_REGIONS.filter(
    (r) => !r.chip && (REGION_MUSCLES[r.key]?.[viewKey]?.length ?? 0) > 0
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
    <div className="body-chart" ref={wrapRef} onMouseMove={onMove} data-view={view}>
      {!readOnly && (
        <div className="body-chart__views" role="group" aria-label="Body view">
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "front"} onClick={() => setView("front")}>
            Front
          </button>
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "back"} onClick={() => setView("back")}>
            Back
          </button>
        </div>
      )}

      <div className="body-chart__figure">
        <svg className="body-chart__svg" viewBox={viewBox} role="group" aria-label={`Body chart, ${view} view`}>
          <g className="body-chart__silhouette" aria-hidden="true">
            {Object.values(muscleMap).flat().map((pts, i) => (
              <polygon key={i} points={pts} />
            ))}
          </g>

          <g className="body-chart__regions">
            {figureRegions.map((r) => {
              const polys = (REGION_MUSCLES[r.key][viewKey] ?? []).flatMap((mk) => muscleMap[mk] ?? []);
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
                  {polys.map((pts, i) => (
                    <polygon key={i} points={pts} />
                  ))}
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
        <>
          <p className="body-chart__chip-hint">Not on the diagram?</p>
          <div className="body-chart__extra">
            {CHIP_REGIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                className="body-chart__extra-btn"
                aria-pressed={selected.has(r.key)}
                title={r.clinical}
                onClick={() => toggle(r.key)}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              className="body-chart__extra-btn"
              aria-pressed={selected.has(SOMEWHERE_ELSE)}
              onClick={() => toggle(SOMEWHERE_ELSE)}
            >
              Somewhere else / not sure
            </button>
          </div>
        </>
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
