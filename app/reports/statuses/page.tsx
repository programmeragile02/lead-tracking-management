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
    weeks: number[]; // [1,2,3,4,5]
    matrix: Record<string, Record<string, Record<number, number>>>;
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
  const weeks = reportRes?.data?.weeks ?? [];

  const totalsPerWeekPerSales = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    sales.forEach((s) => {
      result[String(s.id)] = {};
      weeks.forEach((w) => {
        result[String(s.id)][w] = 0;
      });
    });

    statuses.forEach((st) => {
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach((w) => {
          result[String(s.id)][w] += weeksData[w] ?? 0;
        });
      });
    });

    return result;
  }, [statuses, sales, weeks, matrix]);

  const totalsPerSalesWeekly = useMemo(() => {
    const result: Record<string, number> = {};

    sales.forEach((s) => {
      result[String(s.id)] = 0;
    });

    statuses.forEach((st) => {
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach((w) => {
          result[String(s.id)] += weeksData[w] ?? 0;
        });
      });
    });

    return result;
  }, [statuses, sales, weeks, matrix]);

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

    const headerRow = [
      "Status",
      ...sales.flatMap((s) => weeks.map((w) => `${s.name} W${w}`)),
    ];

    const rows: (string | number)[][] = [headerRow];

    statuses.forEach((st) => {
      const row: (string | number)[] = [`${st.name} (${st.code})`];
      const rowData = matrix[String(st.id)] ?? {};

      sales.forEach((s) => {
        const weeksData = rowData[String(s.id)] ?? {};
        weeks.forEach((w) => {
          row.push(weeksData[w] ?? 0);
        });
      });

      rows.push(row);
    });

    // baris kosong pemisah
    rows.push([]);

    const totalWeeklyRow: (string | number)[] = ["TOTAL"];
    sales.forEach((s) => {
      weeks.forEach((w) => {
        totalWeeklyRow.push(totalsPerWeekPerSales[String(s.id)]?.[w] ?? 0);
      });
    });
    rows.push(totalWeeklyRow);

    const totalPerSalesRow: (string | number)[] = ["TOTAL PER SALES"];
    sales.forEach((s) => {
      weeks.forEach((w, idx) => {
        if (idx === weeks.length - 1) {
          totalPerSalesRow.push(totalsPerSalesWeekly[String(s.id)] ?? 0);
        } else {
          totalPerSalesRow.push("");
        }
      });
    });
    rows.push(totalPerSalesRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Status");

    const label = selectedPeriod?.replace("-", "_") ?? "PERIODE";
    XLSX.writeFile(wb, `Laporan_Status_Lead_${label}.xlsx`);
  };

  return (
    <DashboardLayout title="Laporan Status Lead">
      <div className="space-y-4">
        {/* header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Laporan Status Lead
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Laporan status lead per sales dan per minggu
          </p>
        </div>

        {/* FILTER */}
        <div className="flex flex-wrap items-end gap-3 rounded-md py-3">
          {/* Periode */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] md:text-xs font-medium text-muted-foreground">
              Periode
            </span>
            {loadingPeriod ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-8 w-40 text-xs">
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

          {/* Team Leader (Manager only) */}
          {isManager && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] md:text-xs font-medium text-muted-foreground">
                Team Leader
              </span>
              {!tlRes ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <Select value={selectedTL} onValueChange={setSelectedTL}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Pilih Team Leader" />
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export */}
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={
              loadingUser || loadingReport || !reportRes?.ok || !sales.length
            }
            onClick={handleExportExcel}
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* TABLE + EXPORT */}
        <CardContent className="px-0">
          {loadingUser || loadingReport ? (
            <div className="text-sm text-muted-foreground">
              Memuat laporan...
            </div>
          ) : sales.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada data untuk periode & filter yang dipilih.
            </div>
          ) : !reportRes?.ok ? (
            <div className="text-sm text-primary">
              {reportRes?.error ?? "Gagal memuat laporan"}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead className="bg-secondary">
                  {/* BARIS 1: NAMA SALES */}
                  <tr>
                    <th
                      rowSpan={2}
                      className="border px-3 py-2 text-center font-semibold"
                    >
                      Status
                    </th>
                    {sales.map((s) => (
                      <th
                        key={s.id}
                        colSpan={weeks.length}
                        className="border px-3 py-2 text-center font-semibold"
                      >
                        {s.name}
                      </th>
                    ))}
                  </tr>

                  {/* BARIS 2: WEEK */}
                  <tr>
                    {sales.flatMap((s) =>
                      weeks.map((w) => (
                        <th
                          key={`${s.id}-w${w}`}
                          className="border px-2 py-1 text-center text-[11px]"
                        >
                          W{w}
                        </th>
                      ))
                    )}
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
                          "hover:bg-muted-foreground/10",
                          idx % 2 === 1 && "bg-muted-foreground/5"
                        )}
                      >
                        <td className="border px-3 py-2 font-medium">
                          {st.name}
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            ({st.code})
                          </span>
                        </td>

                        {sales.flatMap((s) => {
                          const weeksData = rowData[String(s.id)] ?? {};
                          return weeks.map((w) => {
                            const value = weeksData[w] ?? 0;
                            return (
                              <td
                                key={`${st.id}-${s.id}-w${w}`}
                                className="border px-2 py-1 text-center tabular-nums"
                              >
                                {value > 0 ? value : "-"}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    );
                  })}

                  {/* TOTAL */}
                  <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL</td>

                    {sales.flatMap((s) =>
                      weeks.map((w) => (
                        <td
                          key={`total-${s.id}-w${w}`}
                          className="border px-2 py-1 text-center tabular-nums"
                        >
                          {totalsPerWeekPerSales[String(s.id)]?.[w] > 0
                            ? totalsPerWeekPerSales[String(s.id)][w]
                            : "-"}
                        </td>
                      ))
                    )}
                  </tr>

                  <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL PER SALES</td>

                    {sales.map((s, idx) => (
                      <td
                        key={`total-sales-${s.id}`}
                        colSpan={weeks.length}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums text-sm",
                          "border-l border-r",
                          idx === 0 && "border-l",
                          idx === sales.length - 1 && "border-r"
                        )}
                      >
                        {totalsPerSalesWeekly[String(s.id)] ?? 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
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
