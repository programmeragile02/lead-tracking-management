"use client";

import { SourceData } from "@/types/report";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getColorByIndex } from "./source-colors";

export function SourcePieChart({ data }: { data: SourceData[] }) {
  return (
    <div className="flex gap-6">
      {/* PIE */}
      <div className="h-[260px] w-[260px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={getColorByIndex(i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _, p: any) => [
                `${value} lead (${p.payload.percentage}%)`,
                p.payload.sourceName,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LEGEND */}
      <div className="flex flex-col justify-center gap-3 text-sm">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getColorByIndex(i) }}
            />
            <span className="flex-1">{item.sourceName}</span>
            <span className="font-medium">{item.count}</span>
            <span className="text-muted-foreground">({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
