"use client";

import { useMemo, useRef, useState } from "react";

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

interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ANATOMY_IMAGE_URL = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Muscles_front_and_back.svg";

const FRONT_ZONES: Record<string, Zone> = {
  "head-jaw": { x: 21.5, y: 12, w: 8, h: 9 },
  neck: { x: 21.5, y: 20, w: 7, h: 7 },
  chest: { x: 21.5, y: 33, w: 15, h: 12 },
  abdomen: { x: 21.5, y: 46, w: 13, h: 14 },
  "side-left": { x: 28, y: 44, w: 6, h: 13 },
  "side-right": { x: 15, y: 44, w: 6, h: 13 },
  "shoulder-left": { x: 29, y: 28, w: 10, h: 8 },
  "shoulder-right": { x: 14, y: 28, w: 10, h: 8 },
  "upper-arm-left": { x: 34, y: 40, w: 7, h: 14 },
  "upper-arm-right": { x: 9, y: 40, w: 7, h: 14 },
  "elbow-left": { x: 37, y: 51, w: 6, h: 7 },
  "elbow-right": { x: 6, y: 51, w: 6, h: 7 },
  "forearm-left": { x: 36, y: 62, w: 7, h: 14 },
  "forearm-right": { x: 7, y: 62, w: 7, h: 14 },
  "hand-left": { x: 35, y: 74, w: 7, h: 8 },
  "hand-right": { x: 8, y: 74, w: 7, h: 8 },
  "hip-left": { x: 27, y: 59, w: 10, h: 9 },
  "hip-right": { x: 16, y: 59, w: 10, h: 9 },
  "thigh-left": { x: 28, y: 70, w: 9, h: 17 },
  "thigh-right": { x: 16, y: 70, w: 9, h: 17 },
  "knee-left": { x: 29, y: 80, w: 8, h: 7 },
  "knee-right": { x: 16, y: 80, w: 8, h: 7 },
  "lower-leg-left": { x: 29, y: 88, w: 8, h: 13 },
  "lower-leg-right": { x: 16, y: 88, w: 8, h: 13 },
  "foot-left": { x: 30, y: 96, w: 9, h: 6 },
  "foot-right": { x: 15, y: 96, w: 9, h: 6 },
};

const BACK_ZONES: Record<string, Zone> = {
  "head-jaw": { x: 71, y: 12, w: 8, h: 9 },
  neck: { x: 71, y: 20, w: 7, h: 7 },
  "upper-back": { x: 71, y: 29, w: 19, h: 12 },
  "mid-back": { x: 71, y: 40, w: 18, h: 13 },
  "lower-back": { x: 71, y: 50, w: 14, h: 10 },
  "shoulder-left": { x: 62, y: 28, w: 10, h: 8 },
  "shoulder-right": { x: 80, y: 28, w: 10, h: 8 },
  "upper-arm-left": { x: 58, y: 40, w: 7, h: 14 },
  "upper-arm-right": { x: 84, y: 40, w: 7, h: 14 },
  "forearm-left": { x: 57, y: 62, w: 7, h: 14 },
  "forearm-right": { x: 85, y: 62, w: 7, h: 14 },
  "hand-left": { x: 57, y: 74, w: 7, h: 8 },
  "hand-right": { x: 85, y: 74, w: 7, h: 8 },
  "hip-left": { x: 66, y: 59, w: 10, h: 9 },
  "hip-right": { x: 77, y: 59, w: 10, h: 9 },
  "buttock-left": { x: 66, y: 63, w: 10, h: 10 },
  "buttock-right": { x: 77, y: 63, w: 10, h: 10 },
  "thigh-left": { x: 66, y: 72, w: 9, h: 17 },
  "thigh-right": { x: 77, y: 72, w: 9, h: 17 },
  "knee-left": { x: 66, y: 81, w: 8, h: 7 },
  "knee-right": { x: 77, y: 81, w: 8, h: 7 },
  "lower-leg-left": { x: 66, y: 89, w: 8, h: 13 },
  "lower-leg-right": { x: 77, y: 89, w: 8, h: 13 },
  "foot-left": { x: 65, y: 96, w: 9, h: 6 },
  "foot-right": { x: 78, y: 96, w: 9, h: 6 },
};

const ZONES: Record<ChartView, Record<string, Zone>> = {
  front: FRONT_ZONES,
  back: BACK_ZONES,
};

export function BodyChart({ value, onChange, readOnly = false, compactReadOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const [showBones, setShowBones] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => new Set(value), [value]);

  const figureRegions = BODY_REGIONS.filter((region) => ZONES[view][region.key]);

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

  function onMove(event: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setTip({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  const chips = value.map((key) => ({ key, label: regionLabel(key) }));

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
      className={`body-chart body-chart--anatomy${showBones ? " show-bones" : ""}${readOnly ? " is-readonly" : ""}`}
      ref={wrapRef}
      onMouseMove={onMove}
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
        {!readOnly && (
          <button
            type="button"
            className="body-chart__bones-btn"
            aria-pressed={showBones}
            onClick={() => setShowBones((b) => !b)}
          >
            {showBones ? "Hide bones guide" : "Show bones guide"}
          </button>
        )}
      </div>

      <div className="body-chart__figure">
        <div className="body-chart__side-labels" aria-hidden="true">
          <span>{view === "front" ? "Your right" : "Your left"}</span>
          <span>{view === "front" ? "Your left" : "Your right"}</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- test anatomy SVG is an external CC BY-SA artwork; keep this easy to revert. */}
        <img
          className="body-chart__anatomy-image"
          src={ANATOMY_IMAGE_URL}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        <div className="body-chart__zones" role="group" aria-label={`Body chart, ${view} view`}>
          {figureRegions.map((region) => {
            const zone = ZONES[view][region.key]!;
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
              />
            );
          })}
        </div>

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

      <p className="body-chart__credit">
        Anatomy artwork: OpenStax, Tomas Kebert and umimeto.org, CC BY-SA 4.0.
      </p>

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
