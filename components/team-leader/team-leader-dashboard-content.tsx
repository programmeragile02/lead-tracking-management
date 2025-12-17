"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SalesPerformanceTable } from "@/components/team-leader/sales-performance-table";
import { ProblemLeadsTabs } from "@/components/team-leader/problem-leads-tabs";
import { Users, Target, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DashboardResponse = {
  ok: boolean;
  data?: {
    summary: {
      teamLeaderId: number;
      teamLeaderName: string;
      teamSize: number;
      periodLabel: string;
      totalLeads: number;
      totalClosing: number;
      totalRevenue: number;
      leadTargetTeam: number;
      leadActualThisMonth: number;
      revenueTargetTeam: number;
      revenueActualThisMonth: number;
    };
    salesPerformance: {
      salesId: number;
      salesName: string;
      leadTarget: number;
      leadActual: number;
      revenueTarget: number;
      revenueActual: number;
      closingCount: number;
    }[];
    problemLeads: {
      overdue: ProblemLeadItem[];
      hotNotClosed: ProblemLeadItem[];
      untouched: ProblemLeadItem[];
    };
  };
};

export type ProblemLeadItem = {
  id: number;
  name: string;
  statusCode: string | null;
  productName: string | null;
  sourceName: string | null;
  createdAt: string;
  nextActionAt?: string | null;
  followUpTypeName?: string | null;
};

function formatRupiah(value: number) {
  if (!value) return "Rp0";
  return `Rp${value.toLocaleString("id-ID")}`;
}


type PeriodOption = {
  value: string; // "YYYY-MM"
  label: string; // "Desember 2025"
};

const MONTH_OPTIONS_COUNT = 6;

export function TeamLeaderDashboardContent() {
  // default: bulan ini
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  // generate 6 bulan terakhir otomatis
  const periodOptions: PeriodOption[] = useMemo(() => {
    const now = new Date();
    const options: PeriodOption[] = [];

    for (let i = 0; i < MONTH_OPTIONS_COUNT; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = d.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }

    return options;
  }, []);

  const { data, error, isLoading } = useSWR<DashboardResponse>(
    `/api/dashboard/team-leader?month=${selectedMonth}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return (
      <div className="text-sm text-red-600">Gagal memuat dashboard tim.</div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40 bg-secondary" />
          <Skeleton className="h-8 w-40 rounded-xl bg-secondary" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl bg-secondary" />
          <Skeleton className="h-32 rounded-2xl bg-secondary" />
          <Skeleton className="h-32 rounded-2xl bg-secondary" />
        </div>
        <Skeleton className="h-64 rounded-2xl bg-secondary" />
        <Skeleton className="h-64 rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!data.ok || !data.data) {
    return (
      <div className="text-sm text-primary">Gagal memuat dashboard tim.</div>
    );
  }

  const { summary, salesPerformance, problemLeads } = data.data;

  const currentPeriodLabel =
    periodOptions.find((p) => p.value === selectedMonth)?.label ||
    summary.periodLabel ||
    "Bulan ini";

  return (
    <div className="space-y-6">
      {/* Header + filter periode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Ringkasan Tim — {currentPeriodLabel}
          </h2>
          <p className="text-xs text-muted-foreground">
            Team Leader:{" "}
            <span className="font-medium text-foreground">
              {summary.teamLeaderName}
            </span>{" "}
            • <span className="font-medium">{summary.teamSize} sales</span> di
            dalam tim
          </p>
        </div>

        {/* Filter Periode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Periode:</span>
          <Select
            value={selectedMonth}
            onValueChange={(val) => setSelectedMonth(val)}
          >
            <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs sm:text-sm shadow-sm bg-secondary border-border">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>

            <SelectContent side="bottom" className="rounded-xl">
              {periodOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs sm:text-sm py-2"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI utama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Lead Tim"
          icon={Users}
          count={summary.totalLeads}
          unit="lead"
          color="red"
        />
        <KPICard
          title="Total Closing"
          icon={Target}
          count={summary.totalClosing}
          unit="deal"
          color="orange"
        />
        <KPICard
          title="Total Pendapatan Closing"
          icon={DollarSign}
          target={summary.revenueTargetTeam}
          actual={summary.revenueActualThisMonth}
          unit="Rp"
          color="amber"
          format={(value) => formatRupiah(value)}
        />
      </div>

      {/* KPI progress vs target */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          title="Lead vs Target Tim"
          icon={Users}
          target={summary.leadTargetTeam}
          actual={summary.leadActualThisMonth}
          unit="lead"
          color="coral"
        />
        <KPICard
          title="Pendapatan vs Target Tim"
          icon={DollarSign}
          target={summary.revenueTargetTeam}
          actual={summary.revenueActualThisMonth}
          unit="Rp"
          color="rose"
          format={(value) => formatRupiah(value)}
        />
      </div>

      {/* Tabel performa per sales */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Performa Sales</h3>
          <p className="text-xs text-muted-foreground">Periode: {currentPeriodLabel}</p>
        </div>
        <SalesPerformanceTable rows={salesPerformance} loading={false} />
      </section>

      {/* Lead problematik (tidak tergantung periode) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Lead Bermasalah</h3>
          <p className="text-xs text-muted-foreground">
            Membantu TL melihat lead yang perlu perhatian khusus.
          </p>
        </div>
        <ProblemLeadsTabs
          overdue={problemLeads.overdue}
          hotNotClosed={problemLeads.hotNotClosed}
          untouched={problemLeads.untouched}
        />
      </section>
    </div>
  );
}
