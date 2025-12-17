"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* =======================
 * TYPES
 * ======================= */
type PeriodResponse = {
  ok: boolean;
  periods: string[];
  defaultPeriod: string;
};

type SalesUser = { id: number; name: string };

type ReportResponse = {
  ok: boolean;
  data: {
    sales: SalesUser[];
    matrix: Record<string, number>;
    totalsPerSales: Record<string, number>;
  };
  error?: string;
};

type TeamLeader = { id: number; name: string };
type TeamLeaderResponse = {
  ok: boolean;
  data: TeamLeader[];
};

/* =======================
 * PAGE
 * ======================= */
export default function LinkClickReportPage() {
  const { user, loading: loadingUser } = useCurrentUser();

  const roleCode = user?.roleCode;
  const isManager = roleCode === "MANAGER";
  const isTeamLeader = roleCode === "TEAM_LEADER";

  /* ===== PERIOD ===== */
  const { data: periodRes, isLoading: loadingPeriod } = useSWR<PeriodResponse>(
    "/api/reports/link-click-periods",
    fetcher
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();
  const [selectedTL, setSelectedTL] = useState<string | undefined>();

  // set default period sekali
  if (!selectedPeriod && periodRes?.defaultPeriod) {
    setSelectedPeriod(periodRes.defaultPeriod);
  }

  /* ===== TEAM LEADER (KHUSUS MANAGER) ===== */
  const { data: tlRes } = useSWR<TeamLeaderResponse>(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  /* ===== REPORT URL ===== */
  const reportUrl = useMemo(() => {
    if (!selectedPeriod) return null;

    if (isManager) {
      if (!selectedTL) return null;
      return `/api/reports/link-clicks-by-sales?period=${selectedPeriod}&teamLeaderId=${selectedTL}`;
    }

    if (isTeamLeader) {
      return `/api/reports/link-clicks-by-sales?period=${selectedPeriod}`;
    }

    return null;
  }, [selectedPeriod, selectedTL, isManager, isTeamLeader]);

  const { data: reportRes, isLoading: loadingReport } = useSWR<ReportResponse>(
    reportUrl,
    fetcher
  );

  const sales = reportRes?.data?.sales ?? [];
  const matrix = reportRes?.data?.matrix ?? {};
  const totalsPerSales = reportRes?.data?.totalsPerSales ?? {};

  const grandTotal = Object.values(totalsPerSales).reduce((a, b) => a + b, 0);

  /* =======================
   * RENDER
   * ======================= */
  return (
    <DashboardLayout title="Laporan Klik Link Lead">
      <div className="space-y-4">
        {/* ================= FILTER ================= */}
        <Card className="border border-border bg-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {/* PERIODE */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Periode Bulan
              </div>
              {loadingPeriod ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodRes?.periods.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {formatPeriodLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* TEAM LEADER (MANAGER ONLY) */}
            {isManager && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Team Leader
                </div>
                {!tlRes ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select value={selectedTL} onValueChange={setSelectedTL}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih team leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {tlRes.data.map((tl) => (
                        <SelectItem
                          key={tl.id}
                          value={String(tl.id)}
                          className="text-xs"
                        >
                          {tl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================= TABLE ================= */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Tabel Laporan Klik Link
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={
                loadingUser || loadingReport || !reportRes?.ok || !sales.length
              }
            >
              <FileDown className="h-4 w-4" />
              Export Excel
            </Button>
          </CardHeader>

          <CardContent>
            {loadingUser || loadingReport ? (
              <div className="text-sm text-muted-foreground">
                Memuat laporan...
              </div>
            ) : !reportRes?.ok ? (
              <div className="text-sm text-primary">
                {reportRes?.error ?? "Gagal memuat laporan"}
              </div>
            ) : sales.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Belum ada data klik link untuk periode ini.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border px-3 py-2 text-left font-semibold">
                        Sales
                      </th>
                      <th className="border px-3 py-2 text-center font-semibold">
                        Total Klik
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, idx) => {
                      const val = matrix[String(s.id)] ?? 0;
                      return (
                        <tr
                          key={s.id}
                          className={idx % 2 === 1 ? "bg-muted/40" : ""}
                        >
                          <td className="border px-3 py-2">{s.name}</td>
                          <td className="border px-3 py-2 text-center tabular-nums">
                            {val > 0 ? val : "-"}
                          </td>
                        </tr>
                      );
                    })}

                    {/* TOTAL */}
                    <tr className="bg-primary">
                      <td className="border px-3 py-2 font-semibold">TOTAL</td>
                      <td className="border px-3 py-2 text-center font-semibold tabular-nums">
                        {grandTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  Angka menunjukkan total klik link yang dilakukan lead pada
                  periode yang dipilih (berdasarkan waktu klik).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* =======================
 * HELPERS
 * ======================= */
function formatPeriodLabel(p: string) {
  const [y, m] = p.split("-");
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const idx = Number(m) - 1;
  return `${bulan[idx] ?? m} ${y}`;
}
