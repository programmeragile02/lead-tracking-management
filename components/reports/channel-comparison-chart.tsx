"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Instagram Ads", value: 128, color: "#fb2c36" },
  { name: "Website", value: 95, color: "#ff6900" },
  { name: "Facebook Ads", value: 72, color: "#fd9a00" },
  { name: "WhatsApp", value: 33, color: "#ff2056" },
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
