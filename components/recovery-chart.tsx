// components/recovery-chart.tsx
"use client";

import { useEffect, useState, forwardRef } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { getPainLogs, getClinicalAssessments } from "@/lib/recovery";
import { SkeletonChart } from "@/components/skeleton";

interface ChartPoint {
  date: string;
  patientPain?: number;
  physioScore?: number;
  mobilityScore?: number;
}

interface Props {
  uid: string;
  personId: string;
  // Additive, defaults to off so components reusing RecoveryChart with the
  // pre-existing two-prop call signature (e.g. AdminRecoveryChart) render
  // exactly as before. app/patient/recovery/page.tsx opts in explicitly.
  showMobility?: boolean;
}

export const RecoveryChart = forwardRef<HTMLDivElement, Props>(
  function RecoveryChart({ uid, personId, showMobility = false }, ref) {
    const [data, setData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Read once at mount — this only gates the one-shot line/area draw-in
    // animation, so it doesn't need to react to the setting changing later.
    const [reduceMotion] = useState(
      () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      Promise.all([
        getPainLogs(uid, personId, 56),
        getClinicalAssessments(uid, personId, 56),
      ]).then(([painLogs, assessments]) => {
        if (cancelled) return;
        const map = new Map<string, ChartPoint>();
        for (const log of painLogs) {
          map.set(log.date, { date: log.date, patientPain: log.score });
        }
        for (const a of assessments) {
          const existing = map.get(a.date) ?? { date: a.date };
          map.set(a.date, { ...existing, physioScore: a.painScore, mobilityScore: a.mobilityScore });
        }
        const sorted = Array.from(map.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        setData(sorted);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setError("Could not load chart data.");
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [uid, personId]);

    const mobilityPoints = data.filter((d) => d.mobilityScore !== undefined);
    const latestMobility = mobilityPoints[mobilityPoints.length - 1]?.mobilityScore;

    return (
      <div className="panel stack" ref={ref}>
        <h3>Recovery progress</h3>
        <p className="muted">Pain score trend over the last 56 days.</p>
        {loading ? (
          <SkeletonChart height={260} />
        ) : error ? (
          <p className="field-error">{error}</p>
        ) : data.length === 0 ? (
          <p className="muted">No data yet. Log your first pain check-in above.</p>
        ) : (
          <div
            className="chart-wrap"
            role="img"
            aria-label={`Pain score trend over the last 56 days. Latest self-reported score: ${
              data[data.length - 1]?.patientPain ?? "not logged"
            }. Baseline (first logged) score: ${data[0]?.patientPain ?? "not logged"}.${
              showMobility && latestMobility !== undefined
                ? ` Latest physio-assessed mobility score: ${latestMobility} out of 10.`
                : ""
            }`}
          >
            {/* role="img" + aria-label above already gives assistive tech a full
                text summary, so the chart internals are hidden to avoid
                redundant/confusing announcements of axis ticks and legend. */}
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data}>
                  <defs>
                    <linearGradient id="recoveryAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* Faint "healthy zone" band: pain 0-3 out of 10. */}
                  <ReferenceArea y1={0} y2={3} fill="var(--color-primary-light)" fillOpacity={0.55} ifOverflow="extendDomain" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)" }}
                    domain={[0, 10]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-secondary)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="patientPain"
                    name="Self-reported"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#recoveryAreaFill)"
                    dot={false}
                    connectNulls
                    isAnimationActive={!reduceMotion}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="physioScore"
                    name="Physio assessment"
                    stroke="var(--color-text-primary)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 4 }}
                    connectNulls
                    isAnimationActive={!reduceMotion}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  {showMobility && (
                    <Line
                      type="monotone"
                      dataKey="mobilityScore"
                      name="Mobility"
                      stroke="var(--color-primary-glow)"
                      strokeWidth={2}
                      strokeDasharray="2 4"
                      dot={{ r: 3 }}
                      connectNulls
                      isAnimationActive={!reduceMotion}
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  }
);
