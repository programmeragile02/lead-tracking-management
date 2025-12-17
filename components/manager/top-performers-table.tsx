"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"

export function TopPerformersTable() {
  const [view, setView] = useState<"sales" | "team">("sales")

  return (
    <div className="bg-secondary rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b flex gap-2">
        <button
          onClick={() => setView("sales")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            view === "sales" ? "bg-primary text-foreground" : "bg-background text-foreground"
          }`}
        >
          By Sales
        </button>
        <button
          onClick={() => setView("team")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            view === "team" ? "bg-primary text-foreground" : "bg-background text-foreground"
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
            <tr className="bg-muted-foreground/10">
              <td className="p-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </td>
              <td className="p-4 font-semibold text-foreground">Sari Dewi</td>
              <td className="p-4 text-right font-semibold text-foreground">12</td>
              <td className="p-4 text-right font-semibold text-foreground">60jt</td>
            </tr>
            <tr className="hover:bg-muted-foreground/5">
              <td className="p-4 text-foreground">2</td>
              <td className="p-4 font-medium text-foreground">Andi Wijaya</td>
              <td className="p-4 text-right text-foreground">10</td>
              <td className="p-4 text-right text-foreground">50jt</td>
            </tr>
            <tr className="hover:bg-muted-foreground/5">
              <td className="p-4 text-foreground">3</td>
              <td className="p-4 font-medium text-foreground">Budi Santoso</td>
              <td className="p-4 text-right text-foreground">8</td>
              <td className="p-4 text-right text-foreground">40jt</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
