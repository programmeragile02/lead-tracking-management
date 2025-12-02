"use client"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const leadsData = [
  { week: "Week 1", value: 42 },
  { week: "Week 2", value: 65 },
  { week: "Week 3", value: 55 },
  { week: "Week 4", value: 80 },
  { week: "Week 5", value: 70 },
  { week: "Week 6", value: 90 },
  { week: "Week 7", value: 85 },
]

const revenueData = [
  { week: "Week 1", value: 62 },
  { week: "Week 2", value: 78 },
  { week: "Week 3", value: 85 },
  { week: "Week 4", value: 95 },
  { week: "Week 5", value: 88 },
  { week: "Week 6", value: 110 },
  { week: "Week 7", value: 105 },
]

export function TrendChart({ type }: { type: "leads" | "revenue" }) {
  const data = type === "leads" ? leadsData : revenueData

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={type === "leads" ? "#8b5cf6" : "#3b82f6"}
            strokeWidth={3}
            dot={{ fill: type === "leads" ? "#8b5cf6" : "#3b82f6", r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
