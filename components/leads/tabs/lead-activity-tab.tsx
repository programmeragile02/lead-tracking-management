import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LeadActivityTab() {
  return (
    <div className="space-y-6">
      {/* Next Follow Up */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Next Follow Up</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Today, 09:30</p>
              <p className="text-sm text-muted-foreground">Follow Up 1 (FU1)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent">
              Reschedule
            </Button>
            <Button className="flex-1 gradient-primary text-white">Mark as Done</Button>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          <ActivityTimelineItem
            time="08:30"
            type="Follow Up"
            description="Called customer, discussed pricing options"
            status="Warm"
          />
          <ActivityTimelineItem
            time="Yesterday, 14:00"
            type="Status Change"
            description="Status changed from Cold to Warm"
            status="Warm"
          />
          <ActivityTimelineItem
            time="2 days ago"
            type="Note"
            description="Customer interested in premium features"
            status="Cold"
          />
        </div>
      </div>
    </div>
  )
}

function ActivityTimelineItem({
  time,
  type,
  description,
  status,
}: {
  time: string
  type: string
  description: string
  status: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary" />
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">{time}</span>
          <span className="text-sm font-semibold">{type}</span>
        </div>
        <p className="text-sm mb-1">{description}</p>
        <p className="text-sm text-muted-foreground">Status: {status}</p>
      </div>
    </div>
  )
}
