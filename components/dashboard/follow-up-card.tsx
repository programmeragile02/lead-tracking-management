import { MessageCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FollowUpCardProps {
  leadName: string
  product: string
  followUpType: string
  time: string
  status: "pending" | "overdue"
}

export function FollowUpCard({ leadName, product, followUpType, time, status }: FollowUpCardProps) {
  return (
    <div className="bg-secondary rounded-xl p-4 shadow-md border-2 border-border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{leadName}</h4>
          <p className="text-sm text-muted-foreground font-medium">
            {product} • <span className="font-semibold text-purple-600">{followUpType}</span>
          </p>
        </div>
        <Badge variant={status === "overdue" ? "destructive" : "secondary"} className="ml-2 font-semibold">
          {status === "overdue" ? "Terlambat" : "Pending"}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-3 border-t-2 border-border">
        <span className="text-sm font-bold text-foreground">{time}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 bg-white hover:bg-green-50 border-green-200 text-green-700 font-semibold"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Chat WA
          </Button>
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-purple-100">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
