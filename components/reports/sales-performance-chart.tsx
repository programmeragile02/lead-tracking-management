"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Andi", target: 50, actual: 45 },
  { name: "Budi", target: 50, actual: 52 },
  { name: "Citra", target: 50, actual: 38 },
  { name: "Dewi", target: 50, actual: 48 },
  { name: "Eko", target: 50, actual: 55 },
]

export function SalesPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} />
        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        />
        <Legend />
        <Bar dataKey="target" fill="#ef4444" name="Target" radius={[8, 8, 0, 0]} />
        <Bar dataKey="actual" fill="#ff6900" name="Aktual" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
