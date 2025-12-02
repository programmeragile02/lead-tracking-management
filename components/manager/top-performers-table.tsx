"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"

export function TopPerformersTable() {
  const [view, setView] = useState<"sales" | "team">("sales")

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b flex gap-2">
        <button
          onClick={() => setView("sales")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "sales" ? "bg-primary text-white" : "bg-muted text-foreground"
          }`}
        >
          By Sales
        </button>
        <button
          onClick={() => setView("team")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "team" ? "bg-primary text-white" : "bg-muted text-foreground"
          }`}
        >
          By Team
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Rank</th>
              <th className="text-left p-4 text-sm font-semibold">Name</th>
              <th className="text-right p-4 text-sm font-semibold">Closings</th>
              <th className="text-right p-4 text-sm font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr className="bg-yellow-50">
              <td className="p-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </td>
              <td className="p-4 font-semibold">Sari Dewi</td>
              <td className="p-4 text-right font-semibold">12</td>
              <td className="p-4 text-right font-semibold">60jt</td>
            </tr>
            <tr>
              <td className="p-4 text-muted-foreground">2</td>
              <td className="p-4 font-medium">Andi Wijaya</td>
              <td className="p-4 text-right">10</td>
              <td className="p-4 text-right">50jt</td>
            </tr>
            <tr>
              <td className="p-4 text-muted-foreground">3</td>
              <td className="p-4 font-medium">Budi Santoso</td>
              <td className="p-4 text-right">8</td>
              <td className="p-4 text-right">40jt</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
