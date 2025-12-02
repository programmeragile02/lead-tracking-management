import { MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface LeadDetailHeaderProps {
  leadName: string
  status: "hot" | "warm" | "cold"
  product: string
  phone: string
}

export function LeadDetailHeader({ leadName, status, product, phone }: LeadDetailHeaderProps) {
  const statusColors = {
    hot: "bg-red-100 text-red-700",
    warm: "bg-orange-100 text-orange-700",
    cold: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{leadName}</h2>
            <Badge className={statusColors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
          </div>
          <p className="text-muted-foreground">{product}</p>
        </div>
        <Button className="gradient-primary text-white">Update Status</Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 bg-transparent">
          <Phone className="h-4 w-4 mr-2" />
          {phone}
        </Button>
        <Button className="flex-1 gradient-primary text-white">
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat on WhatsApp
        </Button>
      </div>
    </div>
  )
}
