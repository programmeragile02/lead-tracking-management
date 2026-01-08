import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LeadsByCityCard } from "@/components/reports/leads-by-city/leads-by-city-card";

export default function LeadsByCityPage() {
  return (
    <DashboardLayout title="Statistik Kota">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Statistik Lead Berdasarkan Kota
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis lead terbanyak dari kota mana saja
          </p>
        </div>

        <LeadsByCityCard />
      </div>
    </DashboardLayout>
  );
}
