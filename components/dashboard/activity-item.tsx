import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  time: string
  type: string
  leadName: string
  status: string
  note: string
}

export function ActivityItem({ time, type, leadName, status, note }: ActivityItemProps) {
  const getStatusColor = (status: string) => {
    if (status === "Hot") return "text-red-600 bg-red-50 border-red-200"
    if (status === "Warm") return "text-orange-600 bg-orange-50 border-orange-200"
    if (status === "Cold") return "text-blue-600 bg-blue-50 border-blue-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <div className="w-4 h-4 rounded-full bg-red-500 shadow-md ring-4 ring-purple-100 z-10" />
        <div className="absolute top-4 w-0.5 h-full bg-red-200" />
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border-2 border-purple-50 hover:shadow-lg transition-all">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{time}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{type}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Lead:</span>
            <span className="font-semibold text-gray-900">{leadName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">Status:</span>
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border", getStatusColor(status))}>
              {status}
            </span>
          </div>

          <p className="text-sm text-gray-600 italic bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            "{note}"
          </p>
        </div>
      </div>
    </div>
  )
}
