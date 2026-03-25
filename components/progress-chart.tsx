"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { week: "Week 1", pain: 7, mobility: 4 },
  { week: "Week 2", pain: 6, mobility: 5 },
  { week: "Week 3", pain: 5, mobility: 6 },
  { week: "Week 4", pain: 4, mobility: 7 },
  { week: "Week 5", pain: 3, mobility: 8 }
];

export function ProgressChart() {
  return (
    <div className="panel stack">
      <h3>Recovery progress</h3>
      <p className="muted">Sample tracking for weekly pain score and mobility confidence.</p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <XAxis dataKey="week" stroke="#51708d" />
            <YAxis stroke="#51708d" />
            <Tooltip />
            <Line type="monotone" dataKey="pain" stroke="#0f3b57" strokeWidth={3} />
            <Line type="monotone" dataKey="mobility" stroke="#50a4d9" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
