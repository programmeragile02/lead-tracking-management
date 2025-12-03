import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FollowUpCard } from "@/components/dashboard/follow-up-card";
import { LeadCard } from "@/components/dashboard/lead-card";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { Target, DollarSign, Flame, AlertCircle } from "lucide-react";

export default function SalesDashboardPage() {
  return (
    <DashboardLayout title="Dashboard Sales" role="sales">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Selamat pagi, Andi</h2>
          <p className="text-muted-foreground">
            Fokus: tindak lanjut lead Hot & yang terlambat
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            title="Target Lead Hari Ini"
            icon={Target}
            target={10}
            actual={6}
            color="red"
          />
          <KPICard
            title="Target Pendapatan Bulanan"
            icon={DollarSign}
            target={50}
            actual={28}
            unit="jt"
            color="orange"
          />
          <KPICard
            title="Lead Aktif (Hot/Warm)"
            icon={Flame}
            hot={8}
            warm={15}
            color="amber"
          />
          <KPICard
            title="Tindak Lanjut Terlambat"
            icon={AlertCircle}
            count={5}
            color="rose"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tindak Lanjut Hari Ini</h3>
            <a
              href="/tasks"
              className="text-sm text-primary hover:text-primary-hover"
            >
              Lihat semua
            </a>
          </div>
          <div className="space-y-3">
            <FollowUpCard
              leadName="Budi Permana"
              product="Produk A"
              followUpType="FU1"
              time="09:30"
              status="pending"
            />
            <FollowUpCard
              leadName="Toko Sejahtera"
              product="Produk B"
              followUpType="FU2"
              time="14:00"
              status="pending"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Lead Baru</h3>
            <a
              href="/leads"
              className="text-sm text-primary hover:text-primary-hover"
            >
              Lihat semua
            </a>
          </div>
          <div className="space-y-3">
            <LeadCard
              leadName="PT Sentosa"
              channel="IG Ads"
              time="08:15"
              status="new"
            />
            <LeadCard
              leadName="Adi Saputra"
              channel="Website"
              time="07:50"
              status="new"
            />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-0">
            <ActivityItem
              time="08:30"
              type="Tindak Lanjut FU2"
              leadName="Budi"
              status="Warm"
              note="Menanyakan harga"
            />
            <ActivityItem
              time="07:15"
              type="Perubahan Status"
              leadName="Sari Dewi"
              status="Hot"
              note="Siap closing"
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
