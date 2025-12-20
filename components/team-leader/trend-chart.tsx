"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrendItem = {
  week: string;
  leads: number;
  revenue: number;
};

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function formatRupiah(value: number) {
  if (!value || value === 0) return "Rp0";
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function TrendChart({
  data,
  type,
}: {
  data: TrendItem[];
  type: "leads" | "revenue";
}) {
  return (
    <div className="bg-secondary rounded-2xl p-6 shadow-md border border-border">
      <h3 className="text-sm font-semibold mb-4">
        Tren {type === "leads" ? "Lead Masuk" : "Pendapatan Closing"}
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" fontSize={12} />
          <YAxis
            width={type === "revenue" ? 90 : 30}
            fontSize={12}
            tickFormatter={(value) =>
              type === "revenue" ? formatRupiah(value) : formatNumber(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={type}
            stroke={type === "leads" ? "#BE3144" : "#ff6900"}
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value;

  return (
    <div className="rounded-xl bg-[#09122C] border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>

      {payload[0].name === "revenue" ? (
        <p className="text-orange-400">
          Pendapatan: <span className="font-bold">{formatRupiah(value)}</span>
        </p>
      ) : (
        <p className="text-primary">
          Leads: <span className="font-bold">{formatNumber(value)}</span>
        </p>
      )}
    </div>
  );
};
