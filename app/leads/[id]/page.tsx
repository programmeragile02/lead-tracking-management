import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LeadDetailHeader } from "@/components/leads/lead-detail-header"
import { LeadDetailTabs } from "@/components/leads/lead-detail-tabs"

export default function LeadDetailPage() {
  return (
    <DashboardLayout title="Lead Detail" role="sales" showBack>
      <div className="space-y-6">
        <LeadDetailHeader leadName="Budi Permana" status="hot" product="Premium Package" phone="+62 812 3456 7890" />

        <LeadDetailTabs />
      </div>
    </DashboardLayout>
  )
}
