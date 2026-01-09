"use client";

import { SourceData } from "@/types/report";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { getColorByIndex } from "./source-colors";

export function SourceBarChart({ data }: { data: SourceData[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="sourceName" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-3 text-sm shadow">
                  <div className="font-semibold">{d.sourceName}</div>
                  <div>{d.count} lead</div>
                  <div className="text-muted-foreground">
                    {d.percentage}% dari total
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={getColorByIndex(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
