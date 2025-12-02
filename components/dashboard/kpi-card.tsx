import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  icon: LucideIcon
  target?: number
  actual?: number
  count?: number
  hot?: number
  warm?: number
  unit?: string
  color: "violet" | "blue" | "purple" | "red" | "green"
}

export function KPICard({ title, icon: Icon, target, actual, count, hot, warm, unit = "", color }: KPICardProps) {
  const percentage = target && actual ? Math.round((actual / target) * 100) : 0

  const colorClasses = {
    violet: "from-violet-500 to-violet-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    green: "from-green-500 to-green-600",
  }

  const bgColorClasses = {
    violet: "bg-gradient-to-br from-violet-50 to-purple-50",
    blue: "bg-gradient-to-br from-blue-50 to-cyan-50",
    purple: "bg-gradient-to-br from-purple-50 to-pink-50",
    red: "bg-gradient-to-br from-red-50 to-orange-50",
    green: "bg-gradient-to-br from-green-50 to-emerald-50",
  }

  return (
    <div className={cn("rounded-2xl p-6 shadow-md border-2 border-white", bgColorClasses[color])}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", colorClasses[color])}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {target !== undefined && actual !== undefined ? (
        <>
          <div className="space-y-1 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600 font-medium">Target:</span>
              <span className="font-semibold text-gray-800">
                {target} {unit}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600 font-medium">Actual:</span>
              <span className="text-3xl font-bold text-gray-900">
                {actual} {unit}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn("h-full bg-gradient-to-r shadow-sm", colorClasses[color])}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </>
      ) : hot !== undefined && warm !== undefined ? (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-600 font-medium">Hot:</span>
            <span className="text-3xl font-bold text-gray-900">{hot}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-600 font-medium">Warm:</span>
            <span className="text-2xl font-bold text-gray-800">{warm}</span>
          </div>
        </div>
      ) : (
        <div>
          <span className="text-4xl font-bold text-gray-900">{count}</span>
          {unit && <span className="text-xl text-gray-600 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  )
}
