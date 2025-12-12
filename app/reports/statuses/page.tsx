"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PeriodResponse = {
  ok: boolean;
  periods: string[];
  defaultPeriod: string;
};

type Status = { id: number; name: string; code: string };
type SalesUser = { id: number; name: string };

type ReportResponse = {
  ok: boolean;
  data: {
    statuses: Status[];
    sales: SalesUser[];
    matrix: Record<string, Record<string, number>>;
    totalsPerSales: Record<string, number>;
  };
  error?: string;
};

type TeamLeader = { id: number; name: string };
type TeamLeaderResponse = {
  ok: boolean;
  data: TeamLeader[];
};

export default function StatusReportPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useCurrentUser();

  const roleCode = user?.roleCode; // "MANAGER" | "TEAM_LEADER" | "SALES"
  const isManager = roleCode === "MANAGER";
  const isTeamLeader = roleCode === "TEAM_LEADER";

  // kalau mau: blokir sales dari halaman ini
  if (!loadingUser && user && !isManager && !isTeamLeader) {
    router.replace("/dashboard");
  }

  // periode: pakai endpoint yg sama dgn tahapan
  const { data: periodRes, isLoading: loadingPeriod } = useSWR<PeriodResponse>(
    "/api/reports/stage-periods",
    fetcher
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();
  const [selectedTL, setSelectedTL] = useState<string | undefined>();

  // list TL hanya untuk manager
  const { data: tlRes } = useSWR<TeamLeaderResponse>(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  // set default periode sekali
  if (!selectedPeriod && periodRes?.defaultPeriod) {
    setSelectedPeriod(periodRes.defaultPeriod);
  }

  const reportUrl = useMemo(() => {
    if (!selectedPeriod) return null;
    if (isManager) {
      if (!selectedTL) return null;
      return `/api/reports/status-by-sales?period=${selectedPeriod}&teamLeaderId=${selectedTL}`;
    }
    if (isTeamLeader) {
      return `/api/reports/status-by-sales?period=${selectedPeriod}`;
    }
    return null;
  }, [selectedPeriod, selectedTL, isManager, isTeamLeader]);

  const { data: reportRes, isLoading: loadingReport } = useSWR<ReportResponse>(
    reportUrl,
    fetcher
  );

  const statuses = reportRes?.data?.statuses ?? [];
  const sales = reportRes?.data?.sales ?? [];
  const matrix = reportRes?.data?.matrix ?? {};
  const totalsPerSales = reportRes?.data?.totalsPerSales ?? {};

  const safeTotals = useMemo(() => {
    const totals: Record<string, number> = { ...totalsPerSales };
    statuses.forEach((st) => {
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const sid = String(s.id);
        if (totals[sid] === undefined) totals[sid] = totals[sid] ?? 0;
        // server sudah hitung total, jadi di sini kita tidak tambah apa-apa lagi
      });
    });
    return totals;
  }, [statuses, sales, matrix, totalsPerSales]);

  // ===== Export Excel =====
  const handleExportExcel = async () => {
    if (!statuses.length || !sales.length) return;
    const XLSX = await import("xlsx");

    const headerRow = ["Status Lead", ...sales.map((s) => s.name)];
    const rows: (string | number)[][] = [headerRow];

    statuses.forEach((st) => {
      const rowData: (string | number)[] = [`${st.name} (${st.code})`];
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const val = row[String(s.id)] ?? 0;
        rowData.push(val);
      });
      rows.push(rowData);
    });

    // baris kosong pemisah
    rows.push([]);

    // baris TOTAL
    const totalRow: (string | number)[] = ["TOTAL"];
    sales.forEach((s) => {
      totalRow.push(safeTotals[String(s.id)] ?? 0);
    });
    rows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Status");

    const label = selectedPeriod?.replace("-", "_") ?? "PERIODE";
    XLSX.writeFile(wb, `Laporan_Status_Lead_${label}.xlsx`);
  };

  return (
    <DashboardLayout title="Laporan Status Lead">
      <div className="space-y-4">
        {/* FILTER */}
        <Card className="border border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-red-700">
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {/* Periode */}
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

            {/* Pilih TL hanya utk manager */}
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

        {/* TABLE + EXPORT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Tabel Report Status Lead
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={
                loadingUser || loadingReport || !reportRes?.ok || !sales.length
              }
              onClick={handleExportExcel}
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
              <div className="text-sm text-red-600">
                {reportRes?.error ?? "Gagal memuat laporan"}
              </div>
            ) : sales.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Belum ada data untuk periode & filter yang dipilih.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="border px-3 py-2 text-left font-semibold">
                        Status
                      </th>
                      {sales.map((s) => (
                        <th
                          key={s.id}
                          className="border px-3 py-2 text-center font-semibold"
                        >
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statuses.map((st, idx) => {
                      const rowKey = String(st.id);
                      const rowData = matrix[rowKey] ?? {};
                      return (
                        <tr
                          key={st.id}
                          className={cn(
                            "hover:bg-red-50/40",
                            idx % 2 === 1 && "bg-muted/30"
                          )}
                        >
                          <td className="border px-3 py-2 font-medium">
                            {st.name}{" "}
                            <span className="text-[10px] text-muted-foreground">
                              ({st.code})
                            </span>
                          </td>
                          {sales.map((s) => {
                            const colKey = String(s.id);
                            const value = rowData[colKey] ?? 0;
                            return (
                              <td
                                key={s.id}
                                className="border px-3 py-2 text-center tabular-nums"
                              >
                                {value > 0 ? value : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* TOTAL per sales */}
                    <tr className="bg-red-50/70">
                      <td className="border px-3 py-2 font-semibold">TOTAL</td>
                      {sales.map((s) => (
                        <td
                          key={s.id}
                          className="border px-3 py-2 text-center font-semibold tabular-nums"
                        >
                          {safeTotals[String(s.id)] ?? 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Angka menunjukkan berapa kali status lead berubah menjadi
                  status tersebut dalam periode yang dipilih (berdasarkan
                  riwayat perubahan status).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

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
