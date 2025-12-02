"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Instagram Ads", value: 128, color: "#8b5cf6" },
  { name: "Website", value: 95, color: "#3b82f6" },
  { name: "Referral", value: 72, color: "#06b6d4" },
  { name: "WhatsApp", value: 33, color: "#10b981" },
]

export function ChannelComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
