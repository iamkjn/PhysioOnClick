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

export function BodyChart({ value, onChange, readOnly = false, compactReadOnly = false, idPrefix = "bc" }: Props) {
  const [view, setView] = useState<ChartView>("front");
  const [hover, setHover] = useState<string | null>(null);
  const selected = useMemo(() => new Set(value), [value]);

  const regionByKey = useMemo(() => new Map(BODY_REGIONS.map((region) => [region.key, region])), []);

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
          <span>Select one or more large areas.</span>
        </div>

        <div className="body-chart__columns" role="group" aria-label={`Body chart, ${view} view`}>
          {(["right", "centre", "left"] as const).map((column) => (
            <section key={column} className={`body-chart__column body-chart__column--${column}`} aria-label={column === "centre" ? "Centre body areas" : `Patient ${column} body areas`}>
              <h4>{column === "centre" ? "Centre" : `Patient ${column}`}</h4>
              <div className="body-chart__region-list">
                {VIEW_REGIONS[view][column].map((key) => {
                  const region = regionByKey.get(key);
                  if (!region) return null;
                  const on = selected.has(region.key);
                  return (
                    <button
                      key={region.key}
                      id={`${idPrefix}-${region.key}`}
                      type="button"
                      className={`body-chart__area-btn${on ? " is-selected" : ""}`}
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
                      <small>{region.clinical}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
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
