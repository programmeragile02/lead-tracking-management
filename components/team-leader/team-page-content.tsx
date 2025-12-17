// components/team-leader/team-page-content.tsx
"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Users, Target, DollarSign } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { TeamSalesTable } from "@/components/team-leader/team-sales-table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TeamMember = {
  salesId: number;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  createdAt: string;

  leadTarget: number;
  closingTarget: number;
  leadsPeriod: number;
  leadsLifetime: number;
  closingPeriod: number;
  revenuePeriod: number;

  fuDoneToday: number;
  fuScheduledToday: number;
  fuOverdue: number;

  overdueLeadCount: number;
  hotNotClosedCount: number;
  untouchedLeadCount: number;

  waStatus: string | null;
  waPhoneNumber: string | null;
};

type TeamApiResponse = {
  ok: boolean;
  data?: {
    summary: {
      teamLeaderId: number;
      teamLeaderName: string;
      teamSize: number;
      periodLabel: string;
      totalLeadsPeriod: number;
      totalClosingPeriod: number;
      totalRevenuePeriod: number;
    };
    members: TeamMember[];
  };
};

type PeriodOption = {
  value: string; // "YYYY-MM"
  label: string; // "Desember 2025"
};

const MONTH_OPTIONS_COUNT = 6;

function formatRupiah(value: number) {
  if (!value) return "Rp0";
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function TeamLeaderTeamContent() {
  // default bulan ini
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

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

  const { data, error, isLoading } = useSWR<TeamApiResponse>(
    `/api/team-leader/team?month=${selectedMonth}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return <div className="text-sm text-primary">Gagal memuat data tim.</div>;
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
      </div>
    );
  }

  if (!data.ok || !data.data) {
    return <div className="text-sm text-primary">Gagal memuat data tim</div>;
  }

  const { summary, members } = data.data;
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
            Tim Penjualan Saya
          </h2>
          <p className="text-xs text-muted-foreground">
            Team Leader:{" "}
            <span className="font-medium text-foreground">
              {summary.teamLeaderName}
            </span>
          </p>
          <p className="font-medium">{summary.teamSize} sales di dalam tim</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Periode:</span>
          <Select
            value={selectedMonth}
            onValueChange={(v) => setSelectedMonth(v)}
          >
            <SelectTrigger className="w-[170px] h-9 rounded-xl text-xs sm:text-sm shadow-sm bg-secondary border">
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

      {/* KPI ringkasan tim */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Lead Tim (periode)"
          icon={Users}
          count={summary.totalLeadsPeriod}
          unit="lead"
          color="red"
        />
        <KPICard
          title="Closing Tim (periode)"
          icon={Target}
          count={summary.totalClosingPeriod}
          unit="deal"
          color="orange"
        />
        <KPICard
          title="Revenue Closing (periode)"
          icon={DollarSign}
          target={0}
          actual={summary.totalRevenuePeriod}
          unit="Rp"
          color="amber"
          format={(value) => formatRupiah(value)}
        />
      </div>

      {/* Tabel anggota tim */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            Anggota Tim & Performa
          </h3>
          <p className="text-xs text-muted-foreground">
            Periode: {currentPeriodLabel}
          </p>
        </div>

        <TeamSalesTable members={members} periodLabel={currentPeriodLabel} />
      </section>
    </div>
  );
}
