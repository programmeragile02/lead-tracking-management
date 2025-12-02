import { Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  leadName: string
  product: string
  followUpType: string
  dueDate: string
  dueTime: string
  status: "overdue" | "pending" | "upcoming"
}

export function TaskCard({ leadName, product, followUpType, dueDate, dueTime, status }: TaskCardProps) {
  const statusColors = {
    overdue: "bg-red-100 text-red-700",
    pending: "bg-orange-100 text-orange-700",
    upcoming: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{leadName}</h4>
            <Badge className={cn("text-xs", statusColors[status])}>{status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {product} • {followUpType}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {dueDate}, {dueTime}
          </span>
        </div>

        <Button size="sm" className="gradient-primary text-white">
          Open Lead
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
