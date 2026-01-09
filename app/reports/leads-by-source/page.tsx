import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SourceReport } from "@/components/reports/lead-by-source/source-report";

export default function LeadSourceReportPage() {
  return (
    <DashboardLayout title="Statistik Sumber Lead">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Statistik Lead Berdasarkan Sumber Lead
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis lead terbanyak dari sumber lead mana saja
          </p>
        </div>

        <SourceReport />
      </div>
    </DashboardLayout>
  );
}
