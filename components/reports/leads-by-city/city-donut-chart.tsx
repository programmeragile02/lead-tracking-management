"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CITY_COLORS } from "./color";

export function CityDonutChart({
  data,
}: {
  data: { city: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="city"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          stroke="rgba(255,255,255,0.08)"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            background: "#020617",
            color: "#ffffff",
            border: "1px solid #1e293b",
            fontSize: 12,
            borderRadius: 8,
          }}
          itemStyle={{ color: "#ffffff" }}
          labelStyle={{ color: "#ffffff" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
