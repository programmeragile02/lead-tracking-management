"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FollowUpCard } from "@/components/dashboard/follow-up-card";
import { LeadCard } from "@/components/dashboard/lead-card";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { Target, DollarSign, Flame, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SalesDashboardApi = {
  ok: boolean;
  data: {
    user: {
      id: number;
      name: string;
    };
    kpi: {
      targetLeadPerDay: number;
      todayLeadCount: number;
      closingTargetAmount: string;
      closingActualAmount: string;
      hotLeadCount: number;
      warmLeadCount: number;
      lateFollowUpCount: number;
    };
    followUpsToday: {
      id: number;
      leadName: string;
      productName: string;
      followUpType: string;
      time: string; // ISO
      status: "pending" | "overdue";
    }[];
    newLeadsToday: {
      id: number;
      leadName: string;
      channel: string;
      createdAt: string; // ISO
    }[];
    recentActivities: {
      id: number;
      time: string; // ISO
      type: string;
      leadName: string;
      status: string; // "HOT" | "WARM" | "COLD" | ...
      note: string;
    }[];
  };
};

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<SalesDashboardApi>);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatTimeHHMM(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// NEW: formatter rupiah
function formatRupiah(value: number): string {
  return value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

export default function SalesDashboardPage() {
  const { data, error } = useSWR<SalesDashboardApi>(
    "/api/dashboard/sales",
    fetcher
  );

  const [activeTab, setActiveTab] = useState<"stats" | "followup">("stats");

  const loading = !data && !error;
  const userName = data?.data.user.name ?? "Sales";

  const greeting = getGreeting();

  // KPI
  const targetLead = data?.data.kpi.targetLeadPerDay ?? 0;
  const actualLeadToday = data?.data.kpi.todayLeadCount ?? 0;

  const closingTarget = Number(data?.data.kpi.closingTargetAmount ?? "0");
  const closingActual = Number(data?.data.kpi.closingActualAmount ?? "0");

  const hotLead = data?.data.kpi.hotLeadCount ?? 0;
  const warmLead = data?.data.kpi.warmLeadCount ?? 0;
  const lateFollowUpCount = data?.data.kpi.lateFollowUpCount ?? 0;

  const followUpsToday = data?.data.followUpsToday ?? [];
  const newLeadsToday = data?.data.newLeadsToday ?? [];
  const recentActivities = data?.data.recentActivities ?? [];

  return (
    <DashboardLayout title="Dashboard Sales">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold">
            {greeting}, {userName}
          </h2>
          {error && (
            <p className="text-sm text-primary mt-1">
              Gagal memuat data dashboard, coba refresh halaman.
            </p>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            title="Target Lead Hari Ini"
            icon={Target}
            target={targetLead}
            actual={actualLeadToday}
            color="red"
          />
          <KPICard
            title="Target Pendapatan Bulanan"
            icon={DollarSign}
            target={closingTarget}
            actual={closingActual}
            color="orange"
            format={formatRupiah}
          />
          <KPICard
            title="Lead Aktif (Hot/Warm)"
            icon={Flame}
            hot={hotLead}
            warm={warmLead}
            color="amber"
          />
          <KPICard
            title="Follow Up Terlambat"
            icon={AlertCircle}
            count={lateFollowUpCount}
            color="rose"
          />
        </div>

        {/* Tabs: Statistik vs Tindak Lanjut */}
        <div className="rounded-2xl bg-secondary/70 border shadow-sm">
          <div className="flex items-center border-b px-4 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
                activeTab === "stats"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Statistik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("followup")}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
                activeTab === "followup"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Follow Up
            </button>
          </div>

          <div className="p-4 space-y-6">
            {activeTab === "stats" ? (
              <>
                {/* Lead Baru */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Lead Baru Hari Ini
                    </h3>
                    <a
                      href="/leads"
                      className="text-sm text-primary hover:text-primary-hover"
                    >
                      Lihat semua
                    </a>
                  </div>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Memuat lead baru hari ini...
                    </p>
                  ) : newLeadsToday.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada lead baru hari ini.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {newLeadsToday.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          leadName={lead.leadName}
                          channel={lead.channel}
                          time={formatTimeHHMM(lead.createdAt)}
                          status="new"
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Aktivitas Terbaru */}
                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    Aktivitas Terbaru
                  </h3>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Memuat aktivitas terbaru...
                    </p>
                  ) : recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada aktivitas terbaru.
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {recentActivities.map((act) => (
                        <ActivityItem
                          key={act.id}
                          time={formatTimeHHMM(act.time)}
                          type={act.type}
                          leadName={act.leadName}
                          status={
                            act.status === "HOT"
                              ? "Hot"
                              : act.status === "WARM"
                              ? "Warm"
                              : act.status === "COLD"
                              ? "Cold"
                              : act.status
                          }
                          note={act.note || "-"}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <>
                {/* Follow Up Hari Ini */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Follow Up Hari Ini
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lateFollowUpCount > 0
                          ? `${lateFollowUpCount} follow up sudah terlambat. Prioritaskan yang merah dulu.`
                          : "Belum ada follow up yang terlambat."}
                      </p>
                    </div>
                    <a
                      href="/tasks"
                      className="text-sm text-primary hover:text-primary-hover"
                    >
                      Lihat semua tugas
                    </a>
                  </div>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Memuat follow up hari ini...
                    </p>
                  ) : followUpsToday.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada jadwal follow up untuk hari ini.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {followUpsToday.map((fu) => (
                        <FollowUpCard
                          key={fu.id}
                          leadName={fu.leadName}
                          product={fu.productName}
                          followUpType={fu.followUpType}
                          time={formatTimeHHMM(fu.time)}
                          status={fu.status}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
