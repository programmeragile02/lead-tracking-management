import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { LeadsReportChart } from "@/components/reports/leads-report-chart";
import { RevenueReportChart } from "@/components/reports/revenue-report-chart";
import { ConversionFunnelChart } from "@/components/reports/conversion-funnel-chart";
import { SalesPerformanceChart } from "@/components/reports/sales-performance-chart";
import { ChannelComparisonChart } from "@/components/reports/channel-comparison-chart";

export default function ReportsPage() {
  return (
    <DashboardLayout title="Laporan">
      <div className="space-y-6">
        {/* Summary Cards */}
        <ReportsSummaryCards />

        {/* Lead Trends */}
        <section className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Tren Lead Bulanan
          </h3>
          <LeadsReportChart />
        </section>

        {/* Revenue Trends */}
        <section className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Tren Pendapatan Bulanan
          </h3>
          <RevenueReportChart />
        </section>

        {/* Conversion Funnel */}
        <section className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Funnel Konversi
          </h3>
          <ConversionFunnelChart />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Performance */}
          <section className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Performa Sales
            </h3>
            <SalesPerformanceChart />
          </section>

          {/* Channel Comparison */}
          <section className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Perbandingan Channel
            </h3>
            <ChannelComparisonChart />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
