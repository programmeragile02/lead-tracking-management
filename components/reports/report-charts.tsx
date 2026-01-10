"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/chart-colors";

type Item = { id: number; name: string };
type Sales = { id: number; name: string };
type Week = { week: number; label: string };

export function ReportCharts({
  title,
  itemType,
  items,
  sales,
  weeks,
  matrix,
  onSelect,
}: {
  title: string;
  itemType: "status" | "sub_status" | "stage" | "follow_up";
  items: Item[];
  sales: Sales[];
  weeks: Week[];
  matrix: Record<string, Record<string, Record<number, number>>>;
  onSelect: (payload: {
    source: "pie" | "bar";
    itemType: "status" | "sub_status" | "stage" | "follow_up";
    itemId: number;
    itemName: string;
    salesId?: number;
    salesName?: string;
  }) => void;
}) {
  /* ================= PIE DATA ================= */
  const pieData = items.map((item) => {
    let total = 0;

    sales.forEach((s) => {
      const weeksData = matrix[String(item.id)]?.[String(s.id)] ?? {};
      weeks.forEach(({ week }) => {
        total += weeksData[week] ?? 0;
      });
    });

    return {
      name: item.name,
      value: total,
    };
  });

  /* ================= BAR DATA ================= */
  const barData = sales.map((s) => {
    const row: any = {
      name: s.name,
      salesId: s.id,
      salesName: s.name,
    };

    items.forEach((item) => {
      let total = 0;
      const weeksData = matrix[String(item.id)]?.[String(s.id)] ?? {};
      weeks.forEach(({ week }) => {
        total += weeksData[week] ?? 0;
      });
      row[item.name] = total;
    });

    return row;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* PIE */}
      <Card>
        <CardHeader>
          <CardTitle>{title} (Distribusi total)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  zIndex: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                  paddingTop: 12,
                  fontSize: 9,
                  color: "#e5e7eb",
                }}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
                onClick={(data, index) => {
                  const item = items[index];
                  if (!item) return;

                  onSelect({
                    source: "pie",
                    itemType,
                    itemId: item.id,
                    itemName: item.name,
                  });
                }}
                className="cursor-pointer"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BAR */}
      <Card>
        <CardHeader>
          <CardTitle>{title} per Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => (
                  <span className="font-semibold text-white">{label}</span>
                )}
                contentStyle={{
                  backgroundColor: "#0f172a", // slate-900
                  border: "1px solid #334155", // slate-700
                  borderRadius: 8,
                  color: "#fff",
                }}
                wrapperStyle={{
                  zIndex: 30,
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 9,
                  zIndex: 10,
                }}
              />
              {items.map((item, i) => (
                <Bar
                  key={item.id}
                  dataKey={item.name}
                  stackId="a"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    if (!data?.payload) return;

                    onSelect({
                      source: "bar",
                      itemType,
                      itemId: item.id,
                      itemName: item.name,
                      salesId: data.payload.salesId,
                      salesName: data.payload.salesName,
                    });
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
