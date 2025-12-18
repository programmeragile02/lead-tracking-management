import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeadCardProps {
  leadName: string
  channel: string
  time: string
  status: "new"
}

export function LeadCard({ leadName, channel, time, status }: LeadCardProps) {
  return (
    <div className="bg-secondary rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{leadName}</h4>
          <p className="text-sm text-muted-foreground">
            {channel} • {time}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
