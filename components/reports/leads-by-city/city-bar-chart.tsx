"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CITY_COLORS } from "./color";

export function CityBarChart({
  data,
  onSelectCity,
}: {
  data: {
    cityId: number;
    city: string;
    count: number;
  }[];
  onSelectCity?: (cityId: number) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
      >
        <XAxis
          type="number"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="city"
          tick={{ fill: "#e5e7eb", fontSize: 12 }}
          axisLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #1e293b",
            borderRadius: 8,
            fontSize: 12,
          }}
          itemStyle={{ color: "#ffffff" }}
          labelStyle={{ color: "#ffffff" }}
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          onClick={(bar) => {
            const payload = bar?.payload as any;
            if (payload?.cityId) onSelectCity?.(payload.cityId);
          }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
