import { KPICard } from "@/components/dashboard/kpi-card"
import { Users, Target, DollarSign, TrendingUp } from "lucide-react"

export function ReportsSummaryCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Total Lead Bulan Ini" icon={Users} count={328} color="red" />
      <KPICard title="Total Closing" icon={Target} count={87} color="orange" />
      <KPICard title="Total Pendapatan" icon={DollarSign} count={450} unit="jt" color="amber" />
      <KPICard title="Tingkat Konversi" icon={TrendingUp} count={26.5} unit="%" color="rose" />
    </div>
  )
}
