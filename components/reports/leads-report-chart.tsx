"use client"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", leads: 245 },
  { month: "Feb", leads: 290 },
  { month: "Mar", leads: 320 },
  { month: "Apr", leads: 280 },
  { month: "Mei", leads: 350 },
  { month: "Jun", leads: 328 },
]

export function LeadsReportChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
