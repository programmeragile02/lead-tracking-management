import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { KPICard } from "@/components/dashboard/kpi-card"
import { SalesPerformanceTable } from "@/components/team-leader/sales-performance-table"
import { ProblemLeadsTabs } from "@/components/team-leader/problem-leads-tabs"
import { Users, Target, DollarSign } from "lucide-react"

export default function TeamLeaderDashboardPage() {
  return (
    <DashboardLayout title="Dashboard Tim" role="team-leader">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard title="Total Lead Tim" icon={Users} count={45} color="red" />
          <KPICard title="Total Closing" icon={Target} count={12} color="orange" />
          <KPICard title="Total Pendapatan" icon={DollarSign} count={150} unit="jt" color="amber" />
        </div>

        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performa Sales</h3>
          <SalesPerformanceTable />
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Bermasalah</h3>
          <ProblemLeadsTabs />
        </section>
      </div>
    </DashboardLayout>
  )
}
