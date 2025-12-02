import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LeadListCard } from "@/components/leads/lead-list-card"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LeadsPage() {
  return (
    <DashboardLayout title="Lead" role="sales">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-background pb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari berdasarkan nama, telepon, atau produk..." className="pl-10 h-11" />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lead List */}
        <div className="space-y-3">
          <LeadListCard
            leadName="Budi Permana"
            status="hot"
            product="Paket Premium"
            channel="IG Ads"
            createdDate="2 hari lalu"
            nextFollowUp="Hari ini, 09:30"
            followUpType="FU1"
            indicator="due-today"
          />
          <LeadListCard
            leadName="PT Sentosa"
            status="warm"
            product="Paket Bisnis"
            channel="Website"
            createdDate="1 hari lalu"
            nextFollowUp="Besok, 10:00"
            followUpType="FU2"
            indicator="updated"
          />
          <LeadListCard
            leadName="Sari Dewi"
            status="hot"
            product="Paket Starter"
            channel="Referral"
            createdDate="3 jam lalu"
            nextFollowUp="Hari ini, 15:00"
            followUpType="FU1"
            indicator="overdue"
          />
          <LeadListCard
            leadName="Toko Sejahtera"
            status="cold"
            product="Enterprise"
            channel="Cold Call"
            createdDate="1 minggu lalu"
            nextFollowUp="Belum dijadwalkan"
            indicator="normal"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
