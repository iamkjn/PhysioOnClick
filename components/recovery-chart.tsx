// components/recovery-chart.tsx
"use client";

import { useEffect, useState, forwardRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getPainLogs, getClinicalAssessments } from "@/lib/recovery";
import { SkeletonChart } from "@/components/skeleton";

interface ChartPoint {
  date: string;
  patientPain?: number;
  physioScore?: number;
}

interface Props {
  uid: string;
  personId: string;
}

export const RecoveryChart = forwardRef<HTMLDivElement, Props>(
  function RecoveryChart({ uid, personId }, ref) {
    const [data, setData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      setError(null);
      Promise.all([
        getPainLogs(uid, personId, 56),
        getClinicalAssessments(uid, personId, 56),
      ]).then(([painLogs, assessments]) => {
        const map = new Map<string, ChartPoint>();
        for (const log of painLogs) {
          map.set(log.date, { date: log.date, patientPain: log.score });
        }
        for (const a of assessments) {
          const existing = map.get(a.date) ?? { date: a.date };
          map.set(a.date, { ...existing, physioScore: a.painScore });
        }
        const sorted = Array.from(map.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        setData(sorted);
        setLoading(false);
      }).catch(() => {
        setError("Could not load chart data.");
        setLoading(false);
      });
    }, [uid, personId]);

    return (
      <div className="panel stack" ref={ref}>
        <h3>Recovery progress</h3>
        <p className="muted">Pain score trend over the last 56 days.</p>
        {loading ? (
          <SkeletonChart height={260} />
        ) : error ? (
          <p className="muted">{error}</p>
        ) : data.length === 0 ? (
          <p className="muted">No data yet — log your first pain check-in above.</p>
        ) : (
          <div
            className="chart-wrap"
            role="img"
            aria-label={`Pain score trend over the last 56 days. Latest self-reported score: ${
              data[data.length - 1]?.patientPain ?? "not logged"
            }. Baseline (first logged) score: ${data[0]?.patientPain ?? "not logged"}.`}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke="var(--color-text-secondary)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis stroke="var(--color-text-secondary)" domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontFamily: "inherit",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patientPain"
                  name="Self-reported"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="physioScore"
                  name="Physio assessment"
                  stroke="var(--color-text-primary)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }
);
