import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FunnelChart } from "@/components/manager/funnel-chart";
import { TrendChart } from "@/components/manager/trend-chart";
import { ChannelPerformanceTable } from "@/components/manager/channel-performance-table";
import { TopPerformersTable } from "@/components/manager/top-performers-table";
import { Users, Target, DollarSign, TrendingUp } from "lucide-react";

export default function ManagerDashboardPage() {
  return (
    <DashboardLayout title="Dashboard Manager">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Lead" icon={Users} count={328} color="red" />
          <KPICard
            title="Total Closing"
            icon={Target}
            count={87}
            color="orange"
          />
          <KPICard
            title="Total Pendapatan"
            icon={DollarSign}
            count={450}
            unit="jt"
            color="amber"
          />
          <KPICard
            title="Tingkat Konversi"
            icon={TrendingUp}
            count={26.5}
            unit="%"
            color="rose"
          />
        </div>

        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Funnel Lead</h3>
          <FunnelChart />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tren Lead Mingguan
            </h3>
            <TrendChart type="leads" />
          </section>
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tren Pendapatan Mingguan
            </h3>
            <TrendChart type="revenue" />
          </section>
        </div>

        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Performa berdasarkan Channel
          </h3>
          <ChannelPerformanceTable />
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Performa Terbaik
          </h3>
          <TopPerformersTable />
        </section>
      </div>
    </DashboardLayout>
  );
}
