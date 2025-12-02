import { Plus, QrCode, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function WhatsAppAccountsList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-4">
        <WhatsAppAccountCard
          number="+62 821 9876 5432"
          status="connected"
          lastSync="2 minutes ago"
          assignedTo="Andi Wijaya"
        />
        <WhatsAppAccountCard
          number="+62 812 3456 7890"
          status="connected"
          lastSync="5 minutes ago"
          assignedTo="Sari Dewi"
        />
        <WhatsAppAccountCard number="+62 813 1111 2222" status="disconnected" lastSync="2 days ago" />
      </div>
    </div>
  )
}

function WhatsAppAccountCard({
  number,
  status,
  lastSync,
  assignedTo,
}: {
  number: string
  status: "connected" | "disconnected"
  lastSync: string
  assignedTo?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{number}</h3>
          <div className="flex items-center gap-3 text-sm">
            <Badge
              variant={status === "connected" ? "default" : "destructive"}
              className={status === "connected" ? "bg-green-500" : ""}
            >
              {status === "connected" ? "Connected" : "Disconnected"}
            </Badge>
            <span className="text-muted-foreground">Last sync: {lastSync}</span>
          </div>
        </div>
      </div>

      {assignedTo && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm text-muted-foreground mb-1">Assigned to</p>
          <p className="font-medium">{assignedTo}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          <QrCode className="h-4 w-4 mr-2" />
          Show QR
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          <Users className="h-4 w-4 mr-2" />
          Assign Sales
        </Button>
      </div>
    </div>
  )
}
