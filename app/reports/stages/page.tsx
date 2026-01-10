"use client";

import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ReportCharts } from "@/components/reports/report-charts";
import { LeadListModal } from "@/components/reports/lead-list-modal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PeriodResponse = {
  ok: boolean;
  periods: string[];
  defaultPeriod: string;
};

type Stage = { id: number; name: string };
type SalesUser = { id: number; name: string };

type ReportResponse = {
  ok: boolean;
  data: {
    stages: Stage[];
    sales: SalesUser[];
    weeks: {
      week: number;
      label: string;
    }[];
    matrix: Record<string, Record<string, Record<number, number>>>;
  };
  error?: string;
};

type TeamLeader = { id: number; name: string };
type TeamLeaderResponse = {
  ok: boolean;
  data: TeamLeader[];
};

export default function StageReportPage() {
  const { user, loading: loadingUser } = useCurrentUser();

  const { data: periodRes, isLoading: loadingPeriod } = useSWR<PeriodResponse>(
    "/api/reports/stage-periods",
    fetcher
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();
  const [selectedTL, setSelectedTL] = useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<any>(null);

  const roleCode = user?.roleCode;
  const isManager = roleCode === "MANAGER";
  const isTeamLeader = roleCode === "TEAM_LEADER";

  // list TL (hanya manager)
  const { data: tlRes } = useSWR<TeamLeaderResponse>(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  useEffect(() => {
    if (isManager && !selectedTL) {
      setSelectedTL("ALL");
    }
  }, [isManager, selectedTL]);

  // set default periode sekali
  if (!selectedPeriod && periodRes?.defaultPeriod) {
    setSelectedPeriod(periodRes.defaultPeriod);
  }

  const reportUrl = useMemo(() => {
    if (!selectedPeriod) return null;
    if (isManager) {
      const qs =
        selectedTL && selectedTL !== "ALL" ? `&teamLeaderId=${selectedTL}` : "";

      return `/api/reports/stage-by-sales?period=${selectedPeriod}${qs}`;
    }

    if (isTeamLeader) {
      return `/api/reports/stage-by-sales?period=${selectedPeriod}`;
    }
    return null;
  }, [selectedPeriod, selectedTL, isManager, isTeamLeader]);

  const { data: reportRes, isLoading: loadingReport } = useSWR<ReportResponse>(
    reportUrl,
    fetcher
  );

  const stages = reportRes?.data?.stages ?? [];
  const sales = reportRes?.data?.sales ?? [];
  const matrix = reportRes?.data?.matrix ?? {};
  const weeks = reportRes?.data?.weeks ?? [];

  const totalsPerWeekPerSales = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    sales.forEach((s) => {
      result[String(s.id)] = {};
      weeks.forEach(({ week }) => {
        result[String(s.id)][week] = 0;
      });
    });

    stages.forEach((st) => {
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          result[String(s.id)][week] += weeksData[week] ?? 0;
        });
      });
    });

    return result;
  }, [stages, sales, weeks, matrix]);

  const totalsPerSalesWeekly = useMemo(() => {
    const result: Record<string, number> = {};

    sales.forEach((s) => {
      result[String(s.id)] = 0;
    });

    stages.forEach((st) => {
      const row = matrix[String(st.id)] ?? {};
      sales.forEach((s) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          result[String(s.id)] += weeksData[week] ?? 0;
        });
      });
    });

    return result;
  }, [stages, sales, weeks, matrix]);

  // ===== EXPORT EXCEL =====
  const handleExportExcel = async () => {
    if (!stages.length || !sales.length) return;
    const XLSX = await import("xlsx");

    const headerRow = [
      "Tahapan",
      ...sales.flatMap((s) =>
        weeks.map((w) => `${s.name} W${w.week} (${w.label})`)
      ),
    ];

    const rows: (string | number)[][] = [headerRow];

    stages.forEach((st) => {
      const row: (string | number)[] = [st.name];
      const rowData = matrix[String(st.id)] ?? {};

      sales.forEach((s) => {
        const weeksData = rowData[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          row.push(weeksData[week] ?? 0);
        });
      });

      rows.push(row);
    });

    // TOTAL PER WEEK
    const totalWeekRow: (string | number)[] = ["TOTAL"];
    sales.forEach((s) => {
      weeks.forEach(({ week }) => {
        totalWeekRow.push(totalsPerWeekPerSales[String(s.id)]?.[week] ?? 0);
      });
    });
    rows.push(totalWeekRow);

    // TOTAL PER SALES
    const totalSalesRow: (string | number)[] = ["TOTAL PER SALES"];
    sales.forEach((s) => {
      weeks.forEach((_, idx) => {
        totalSalesRow.push(
          idx === weeks.length - 1
            ? totalsPerSalesWeekly[String(s.id)] ?? 0
            : ""
        );
      });
    });
    rows.push(totalSalesRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Tahapan");

    const label = selectedPeriod?.replace("-", "_") ?? "PERIODE";
    XLSX.writeFile(wb, `Laporan_Tahapan_${label}.xlsx`);
  };

  return (
    <DashboardLayout title="Laporan Tahapan Penjualan">
      <div className="space-y-4">
        {/* header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Laporan Tahapan Lead
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Laporan tahapan lead per sales dan per minggu
          </p>
        </div>

        {/* FILTER */}
        <div className="flex flex-wrap items-end gap-3 rounded-md py-3">
          {/* Periode */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">Periode</span>
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
          </div>

          {isManager && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">
                Team Leader
              </span>
              <Select value={selectedTL} onValueChange={setSelectedTL}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Pilih Team Leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    Semua Team Leader
                  </SelectItem>

                  {tlRes?.data.map((tl) => (
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
            </div>
          )}

          <div className="flex-1" />

          <Button
            variant="default"
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
        </div>

        {/* TABLE */}
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
            <>
              <div className="mb-4">
                <ReportCharts
                  title="Tahapan Lead"
                  itemType="stage"
                  items={stages}
                  sales={sales}
                  weeks={weeks}
                  matrix={matrix}
                  onSelect={(payload) => {
                    setFilter({
                      ...payload,
                      period: selectedPeriod,
                    });
                    setModalOpen(true);
                  }}
                />
              </div>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-secondary">
                    {/* BARIS 1: NAMA SALES */}
                    <tr>
                      <th
                        rowSpan={2}
                        className="border sticky left-0 z-20 px-3 py-2 text-center font-semibold bg-secondary"
                      >
                        Tahapan
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
                            key={`${s.id}-w${w.week}`}
                            className="border px-2 py-1 text-center text-[11px]"
                          >
                            W{w.week}
                            <div className="text-[10px] text-muted-foreground">
                              ({w.label})
                            </div>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {stages.map((st, idx) => {
                      const row = matrix[String(st.id)] ?? {};

                      return (
                        <tr
                          key={st.id}
                          className={cn(
                            "hover:bg-muted-foreground/10",
                            idx % 2 === 1 && "bg-muted-foreground/5"
                          )}
                        >
                          <td className="border sticky left-0 z-20 px-3 py-2 font-medium bg-background">
                            {st.name}
                          </td>

                          {sales.flatMap((s) => {
                            const weeksData = row[String(s.id)] ?? {};

                            return weeks.map(({ week }) => {
                              const value = weeksData[week] ?? 0;

                              return (
                                <td
                                  key={`${st.id}-${s.id}-w${week}`}
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

                    {/* TOTAL PER WEEK */}
                    {/* <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL PER MINGGU</td>

                    {sales.flatMap((s) =>
                      weeks.map(({ week }) => {
                        const value =
                          totalsPerWeekPerSales[String(s.id)]?.[week] ?? 0;
                        return (
                          <td
                            key={`total-${s.id}-w${week}`}
                            className="border px-2 py-1 text-center tabular-nums"
                          >
                            {value > 0 ? value : "-"}
                          </td>
                        );
                      })
                    )}
                  </tr> */}

                    {/* TOTAL PER SALES */}
                    {/* <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL PER SALES</td>

                    {sales.map((s) => (
                      <td
                        key={s.id}
                        colSpan={weeks.length}
                        className="border-l border-r text-center tabular-nums"
                      >
                        {totalsPerSalesWeekly[String(s.id)] ?? 0}
                      </td>
                    ))}
                  </tr> */}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </div>
      <LeadListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        filter={filter}
      />
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
