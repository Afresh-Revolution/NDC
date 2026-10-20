"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PoolChart({ data }: { data: { name: string; kobo: number }[] }) {
  const rows = data.map((d) => ({ name: d.name, naira: d.kobo / 100 }));
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="naira" fill="#c24d1a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
