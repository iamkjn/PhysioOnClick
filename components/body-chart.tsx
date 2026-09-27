"use client";

import { useMemo, useState } from "react";

import {
  BODY_REGIONS,
  SOMEWHERE_ELSE,
  regionClinical,
  regionLabel,
  type ChartView,
} from "@/lib/body-chart";

interface Props {
  value: string[];
  onChange?: (next: string[]) => void;
  readOnly?: boolean;
  compactReadOnly?: boolean;
  idPrefix?: string;
}

type RegionColumn = "right" | "centre" | "left";

interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

const VIEW_REGIONS: Record<ChartView, Record<RegionColumn, string[]>> = {
  front: {
    right: [
      "shoulder-right",
      "upper-arm-right",
      "elbow-right",
      "forearm-right",
      "hand-right",
      "side-right",
      "hip-right",
      "thigh-right",
      "knee-right",
      "lower-leg-right",
      "foot-right",
    ],
    centre: ["head-jaw", "neck", "chest", "abdomen"],
    left: [
      "shoulder-left",
      "upper-arm-left",
      "elbow-left",
      "forearm-left",
      "hand-left",
      "side-left",
      "hip-left",
      "thigh-left",
      "knee-left",
      "lower-leg-left",
      "foot-left",
    ],
  },
  back: {
    right: [
      "shoulder-right",
      "upper-arm-right",
      "elbow-right",
      "forearm-right",
      "hand-right",
      "hip-right",
      "buttock-right",
      "thigh-right",
      "knee-right",
      "lower-leg-right",
      "foot-right",
    ],
    centre: ["head-jaw", "neck", "upper-back", "mid-back", "lower-back"],
    left: [
      "shoulder-left",
      "upper-arm-left",
      "elbow-left",
      "forearm-left",
      "hand-left",
      "hip-left",
      "buttock-left",
      "thigh-left",
      "knee-left",
      "lower-leg-left",
      "foot-left",
    ],
  },
};

const BODY_MAP_ZONES: Record<ChartView, Record<string, Zone>> = {
  front: {
    "head-jaw": { x: 50, y: 8, w: 18, h: 10 },
    neck: { x: 50, y: 17, w: 14, h: 7 },
    chest: { x: 50, y: 29, w: 30, h: 13 },
    abdomen: { x: 50, y: 43, w: 25, h: 16 },
    "side-right": { x: 35, y: 43, w: 10, h: 18 },
    "side-left": { x: 65, y: 43, w: 10, h: 18 },
    "shoulder-right": { x: 31, y: 25, w: 15, h: 10 },
    "shoulder-left": { x: 69, y: 25, w: 15, h: 10 },
    "upper-arm-right": { x: 22, y: 38, w: 12, h: 17 },
    "upper-arm-left": { x: 78, y: 38, w: 12, h: 17 },
    "elbow-right": { x: 19, y: 50, w: 10, h: 8 },
    "elbow-left": { x: 81, y: 50, w: 10, h: 8 },
    "forearm-right": { x: 17, y: 61, w: 12, h: 18 },
    "forearm-left": { x: 83, y: 61, w: 12, h: 18 },
    "hand-right": { x: 16, y: 75, w: 12, h: 10 },
    "hand-left": { x: 84, y: 75, w: 12, h: 10 },
    "hip-right": { x: 41, y: 58, w: 16, h: 11 },
    "hip-left": { x: 59, y: 58, w: 16, h: 11 },
    "thigh-right": { x: 41, y: 72, w: 15, h: 20 },
    "thigh-left": { x: 59, y: 72, w: 15, h: 20 },
    "knee-right": { x: 41, y: 83, w: 13, h: 9 },
    "knee-left": { x: 59, y: 83, w: 13, h: 9 },
    "lower-leg-right": { x: 40, y: 93, w: 14, h: 18 },
    "lower-leg-left": { x: 60, y: 93, w: 14, h: 18 },
    "foot-right": { x: 38, y: 98, w: 15, h: 7 },
    "foot-left": { x: 62, y: 98, w: 15, h: 7 },
  },
  back: {
    "head-jaw": { x: 50, y: 8, w: 18, h: 10 },
    neck: { x: 50, y: 17, w: 14, h: 7 },
    "upper-back": { x: 50, y: 29, w: 34, h: 15 },
    "mid-back": { x: 50, y: 43, w: 31, h: 15 },
    "lower-back": { x: 50, y: 55, w: 27, h: 12 },
    "shoulder-right": { x: 31, y: 25, w: 15, h: 10 },
    "shoulder-left": { x: 69, y: 25, w: 15, h: 10 },
    "upper-arm-right": { x: 22, y: 38, w: 12, h: 17 },
    "upper-arm-left": { x: 78, y: 38, w: 12, h: 17 },
    "elbow-right": { x: 19, y: 50, w: 10, h: 8 },
    "elbow-left": { x: 81, y: 50, w: 10, h: 8 },
    "forearm-right": { x: 17, y: 61, w: 12, h: 18 },
    "forearm-left": { x: 83, y: 61, w: 12, h: 18 },
    "hand-right": { x: 16, y: 75, w: 12, h: 10 },
    "hand-left": { x: 84, y: 75, w: 12, h: 10 },
    "hip-right": { x: 41, y: 61, w: 16, h: 11 },
    "hip-left": { x: 59, y: 61, w: 16, h: 11 },
    "buttock-right": { x: 41, y: 66, w: 16, h: 12 },
    "buttock-left": { x: 59, y: 66, w: 16, h: 12 },
    "thigh-right": { x: 41, y: 76, w: 15, h: 20 },
    "thigh-left": { x: 59, y: 76, w: 15, h: 20 },
    "knee-right": { x: 41, y: 85, w: 13, h: 9 },
    "knee-left": { x: 59, y: 85, w: 13, h: 9 },
    "lower-leg-right": { x: 40, y: 94, w: 14, h: 18 },
    "lower-leg-left": { x: 60, y: 94, w: 14, h: 18 },
    "foot-right": { x: 38, y: 98, w: 15, h: 7 },
    "foot-left": { x: 62, y: 98, w: 15, h: 7 },
  },
};

function BodyMapFigure({ view, idPrefix }: { view: ChartView; idPrefix: string }) {
  const gradientId = `${idPrefix}-${view}-muscle`;
  const lineId = `${idPrefix}-${view}-line`;
  return (
    <svg className="body-chart__body-svg" viewBox="0 0 220 520" role="img" aria-label={`${view} body anatomy guide`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6b08f" />
          <stop offset="52%" stopColor="#e8795d" />
          <stop offset="100%" stopColor="#b84d4a" />
        </linearGradient>
        <linearGradient id={lineId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fef2f2" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <g className="body-chart__body-shadow">
        <ellipse cx="110" cy="500" rx="66" ry="13" />
      </g>
      <g className="body-chart__body-shape">
        <ellipse cx="110" cy="45" rx="29" ry="35" />
        <path d="M92 78h36l9 28-8 22H91l-8-22 9-28Z" />
        <path d="M74 117c8-13 22-20 36-20s28 7 36 20c10 24 14 54 11 92l-12 80H75l-12-80c-3-38 1-68 11-92Z" />
        <path d="M70 122c-25 15-37 45-43 92l-10 76c-1 9 6 17 15 17 8 0 14-6 15-14l11-70c4-24 10-43 21-55l5-26-14-20Z" />
        <path d="M150 122c25 15 37 45 43 92l10 76c1 9-6 17-15 17-8 0-14-6-15-14l-11-70c-4-24-10-43-21-55l-5-26 14-20Z" />
        <path d="M82 288h55l16 191c1 12-8 22-20 22-10 0-18-7-20-17l-10-89-10 89c-2 10-10 17-20 17-12 0-21-10-20-22l16-191Z" />
      </g>
      <g className="body-chart__body-lines">
        <path d="M110 95v192" />
        <path d="M83 130c17 14 37 14 54 0" />
        <path d="M78 190c21 10 43 10 64 0" />
        <path d="M76 252c22 9 46 9 68 0" />
        <path d="M91 300c5 42 7 82 6 122" />
        <path d="M129 300c-5 42-7 82-6 122" />
        <path d="M58 219c-12 16-18 38-19 66" />
        <path d="M162 219c12 16 18 38 19 66" />
        {view === "back" ? (
          <>
            <path d="M82 116c17 36 39 36 56 0" />
            <path d="M83 161c17 17 37 17 54 0" />
            <path d="M88 221c15 12 29 12 44 0" />
          </>
        ) : (
          <>
            <path d="M78 118c20 24 44 24 64 0" />
            <path d="M88 154c15 16 29 16 44 0" />
            <path d="M91 205c12 14 26 14 38 0" />
          </>
        )}
      </g>
    </svg>
  );
}

export function BodyChart({ value, onChange, readOnly = false, compactReadOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const [hover, setHover] = useState<string | null>(null);
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

  const chips = value.map((key) => ({ key, label: regionLabel(key) }));
  const visibleRegionKeys = VIEW_REGIONS[view].right.concat(VIEW_REGIONS[view].centre, VIEW_REGIONS[view].left);

  if (readOnly && compactReadOnly) {
    return (
      <div className="body-chart body-chart--readonly-summary">
        {chips.length > 0 ? (
          <ul className="body-chart__chips" aria-label="Selected areas">
            {chips.map((chip) => (
              <li key={chip.key} className="body-chart__chip">
                {chip.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No body areas selected.</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`body-chart body-chart--picker${readOnly ? " is-readonly" : ""}`}
      data-view={view}
    >
      <div className="body-chart__toolbar">
        <div className="body-chart__views" role="group" aria-label="Body view">
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "front"} onClick={() => setView("front")}>
            Front
          </button>
          <button type="button" className="body-chart__view-btn" aria-pressed={view === "back"} onClick={() => setView("back")}>
            Back
          </button>
        </div>
      </div>

      <div className="body-chart__figure">
        <div className="body-chart__view-title">
          <strong>{view === "front" ? "Front view" : "Back view"}</strong>
          <span>Tap the body area involved.</span>
        </div>

        <div className="body-chart__visual" role="group" aria-label={`Body chart, ${view} view`}>
          <div className="body-chart__side-labels" aria-hidden="true">
            <span>{view === "front" ? "Patient right" : "Patient left"}</span>
            <span>{view === "front" ? "Patient left" : "Patient right"}</span>
          </div>
          <BodyMapFigure view={view} idPrefix={idPrefix} />
          <div className="body-chart__zones">
            {visibleRegionKeys.map((key) => {
              const region = BODY_REGIONS.find((item) => item.key === key);
              const zone = BODY_MAP_ZONES[view][key];
              if (!region || !zone) return null;
              const on = selected.has(region.key);
              return (
                <button
                  key={region.key}
                  id={`${idPrefix}-${region.key}`}
                  type="button"
                  className={`body-chart__zone${on ? " is-selected" : ""}`}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
                  aria-label={region.label}
                  aria-pressed={on}
                  tabIndex={readOnly ? -1 : 0}
                  onClick={() => toggle(region.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle(region.key);
                    }
                  }}
                  onMouseEnter={() => setHover(region.key)}
                  onMouseLeave={() => setHover((h) => (h === region.key ? null : h))}
                  onFocus={() => setHover(region.key)}
                  onBlur={() => setHover((h) => (h === region.key ? null : h))}
                >
                  <span>{region.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hover && (
          <div className="body-chart__tooltip" role="status">
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
          {chips.map((chip) => (
            <li key={chip.key} className="body-chart__chip">
              {chip.label}
              {!readOnly && (
                <button type="button" aria-label={`Remove ${chip.label}`} onClick={() => toggle(chip.key)}>
                  x
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
