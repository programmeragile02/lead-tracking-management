"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ReportCharts } from "@/components/reports/report-charts";
import { LeadListModal } from "@/components/reports/lead-list-modal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ================= TYPES ================= */

type PeriodResponse = {
  ok: boolean;
  periods: string[];
  defaultPeriod: string;
};

type SubStatus = { id: number; name: string; code: string };
type SalesUser = { id: number; name: string };

type WeekItem = {
  week: number;
  label: string;
};

type ReportResponse = {
  ok: boolean;
  data: {
    subStatuses: SubStatus[];
    sales: SalesUser[];
    weeks: WeekItem[];
    matrix: Record<string, Record<string, Record<number, number>>>;
  };
  error?: string;
};

type TeamLeader = { id: number; name: string };
type TeamLeaderResponse = { ok: boolean; data: TeamLeader[] };

/* ================= PAGE ================= */

export default function SubStatusReportPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useCurrentUser();

  const roleCode = user?.roleCode;
  const isManager = roleCode === "MANAGER";
  const isTeamLeader = roleCode === "TEAM_LEADER";

  // blokir SALES
  if (!loadingUser && user && !isManager && !isTeamLeader) {
    router.replace("/dashboard");
  }

  /* ===== PERIOD ===== */
  const { data: periodRes, isLoading: loadingPeriod } = useSWR<PeriodResponse>(
    "/api/reports/stage-periods",
    fetcher
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string>();
  const [selectedTL, setSelectedTL] = useState<string>();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<any>(null);

  // default period
  useEffect(() => {
    if (!selectedPeriod && periodRes?.defaultPeriod) {
      setSelectedPeriod(periodRes.defaultPeriod);
    }
  }, [selectedPeriod, periodRes]);

  /* ===== TEAM LEADER ===== */
  const { data: tlRes } = useSWR<TeamLeaderResponse>(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  // auto select all tl
  useEffect(() => {
    if (isManager && !selectedTL) {
      setSelectedTL("ALL");
    }
  }, [isManager, selectedTL]);

  /* ===== REPORT URL ===== */
  const reportUrl = useMemo(() => {
    if (!selectedPeriod) return null;

    if (isManager) {
      const qs =
        selectedTL && selectedTL !== "ALL" ? `&teamLeaderId=${selectedTL}` : "";

      return `/api/reports/sub-status-by-sales?period=${selectedPeriod}${qs}`;
    }

    if (isTeamLeader) {
      return `/api/reports/sub-status-by-sales?period=${selectedPeriod}`;
    }

    return null;
  }, [selectedPeriod, selectedTL, isManager, isTeamLeader]);

  const { data: reportRes, isLoading: loadingReport } = useSWR<ReportResponse>(
    reportUrl,
    fetcher
  );

  const subStatuses = reportRes?.data?.subStatuses ?? [];
  const sales = reportRes?.data?.sales ?? [];
  const weeks = reportRes?.data?.weeks ?? [];
  const matrix = reportRes?.data?.matrix ?? {};

  /* ================= EXPORT EXCEL ================= */

  const handleExportExcel = async () => {
    if (!subStatuses.length || !sales.length) return;

    const XLSX = await import("xlsx");

    const headerRow = [
      "Sub Status",
      ...sales.flatMap((s) =>
        weeks.map((w) => `${s.name} W${w.week} (${w.label})`)
      ),
    ];

    const rows: (string | number)[][] = [headerRow];

    subStatuses.forEach((ss) => {
      const row: (string | number)[] = [`${ss.name} (${ss.code})`];
      const rowData = matrix[String(ss.id)] ?? {};

      sales.forEach((s) => {
        const weeksData = rowData[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          row.push(weeksData[week] ?? 0);
        });
      });

      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Sub Status");

    const label = selectedPeriod?.replace("-", "_") ?? "PERIODE";
    XLSX.writeFile(wb, `Laporan_Sub_Status_${label}.xlsx`);
  };

  /* ================= RENDER ================= */

  return (
    <DashboardLayout title="Laporan Sub Status Lead">
      <div className="space-y-4">
        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold">Laporan Sub Status Lead</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rekap perubahan sub status lead per sales dan per minggu
          </p>
        </div>

        {/* FILTER */}
        <div className="flex flex-wrap items-end gap-3 py-3">
          {/* Periode */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
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

          {/* Team Leader */}
          {isManager && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
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
                    <SelectItem value="ALL" className="text-xs font-medium">
                      Semua Team Leader
                    </SelectItem>

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

          <div className="flex-1" />

          {/* EXPORT */}
          <Button
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={loadingReport || !subStatuses.length}
            onClick={handleExportExcel}
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* CONTENT */}
        <CardContent className="px-0">
          {loadingUser || loadingReport ? (
            <div className="text-sm text-muted-foreground">
              Memuat laporan...
            </div>
          ) : !reportRes?.ok ? (
            <div className="text-sm text-destructive">
              {reportRes?.error ?? "Gagal memuat laporan"}
            </div>
          ) : (
            <>
              {/* CHART */}
              <div className="mb-4">
                <ReportCharts
                  title="Sub Status Lead"
                  itemType="sub_status"
                  items={subStatuses}
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

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-secondary">
                    <tr>
                      <th
                        rowSpan={2}
                        className="border sticky left-0 z-20 px-3 py-2 text-center font-semibold bg-secondary"
                      >
                        Sub Status
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
                    {subStatuses.map((ss, i) => {
                      const row = matrix[String(ss.id)] ?? {};

                      return (
                        <tr
                          key={ss.id}
                          className={cn(
                            "hover:bg-muted-foreground/10",
                            i % 2 === 1 && "bg-muted-foreground/5"
                          )}
                        >
                          <td className="border sticky left-0 z-10 px-3 py-2 font-medium bg-background">
                            {ss.name}
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({ss.code})
                            </span>
                          </td>

                          {sales.flatMap((s) => {
                            const weeksData = row[String(s.id)] ?? {};
                            return weeks.map(({ week }) => (
                              <td
                                key={`${ss.id}-${s.id}-w${week}`}
                                className="border px-2 py-1 text-center tabular-nums"
                              >
                                {weeksData[week] > 0 ? weeksData[week] : "-"}
                              </td>
                            ));
                          })}
                        </tr>
                      );
                    })}
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

/* ================= UTIL ================= */

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
  return `${bulan[Number(m) - 1] ?? m} ${y}`;
}
