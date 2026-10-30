// components/body-chart-selection.tsx
// The "somewhere else" toggle and the selected-area chips, shared by the flat
// (components/body-chart.tsx) and 3D (components/body-chart-3d.tsx) charts.

import { SOMEWHERE_ELSE, regionLabel } from "@/lib/body-chart";

interface Props {
  value: string[];
  onToggle: (key: string) => void;
  readOnly?: boolean;
}

export function BodyChartSelection({ value, onToggle, readOnly = false }: Props) {
  return (
    <>
      {!readOnly && (
        <button
          type="button"
          className="body-chart__elsewhere"
          aria-pressed={value.includes(SOMEWHERE_ELSE)}
          onClick={() => onToggle(SOMEWHERE_ELSE)}
        >
          Somewhere else / not sure
        </button>
      )}

      {value.length > 0 && (
        <ul className="body-chart__chips" aria-label="Selected areas">
          {value.map((key) => {
            const label = regionLabel(key);
            return (
              <li key={key} className="body-chart__chip">
                {label}
                {!readOnly && (
                  <button type="button" aria-label={`Remove ${label}`} onClick={() => onToggle(key)}>
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
