"use client"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", revenue: 380 },
  { month: "Feb", revenue: 420 },
  { month: "Mar", revenue: 490 },
  { month: "Apr", revenue: 410 },
  { month: "Mei", revenue: 520 },
  { month: "Jun", revenue: 450 },
]

export function RevenueReportChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
        <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
