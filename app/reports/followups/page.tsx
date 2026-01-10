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
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReportCharts } from "@/components/reports/report-charts";
import { LeadListModal } from "@/components/reports/lead-list-modal";

type WeekItem = {
  week: number;
  label: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FollowUpReportPage() {
  const { user, loading } = useCurrentUser();
  const role = user?.roleCode;

  const isManager = role === "MANAGER";
  const isTeamLeader = role === "TEAM_LEADER";

  const { data: periodRes } = useSWR("/api/reports/stage-periods", fetcher);
  const [period, setPeriod] = useState<string>();
  const [teamLeaderId, setTeamLeaderId] = useState<string>();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<any>(null);

  if (!period && periodRes?.defaultPeriod) {
    setPeriod(periodRes.defaultPeriod);
  }

  const { data: tlRes } = useSWR(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  useEffect(() => {
    if (isManager && !teamLeaderId) {
      setTeamLeaderId("ALL");
    }
  }, [isManager, teamLeaderId]);

  const reportUrl = useMemo(() => {
    if (!period) return null;
    if (isManager) {
      const qs =
        teamLeaderId && teamLeaderId !== "ALL" ? `&teamLeaderId=${teamLeaderId}` : "";

      return `/api/reports/followup-by-sales?period=${period}${qs}`;
    }

    if (isTeamLeader) {
      return `/api/reports/followup-by-sales?period=${period}`;
    }
    return null;
  }, [period, teamLeaderId, isManager, isTeamLeader]);

  const { data, isLoading } = useSWR(reportUrl, fetcher);

  const followUps = data?.data?.followUpTypes ?? [];
  const sales = data?.data?.sales ?? [];
  const matrix = data?.data?.matrix ?? {};
  const totals = data?.data?.totalsPerSales ?? {};
  const weeks: WeekItem[] = data?.data?.weeks ?? [];

  const totalsPerWeekPerSales = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    sales.forEach((s: any) => {
      result[String(s.id)] = {};
      weeks.forEach(({ week }) => {
        result[String(s.id)][week] = 0;
      });
    });

    followUps.forEach((fu: any) => {
      const row = matrix[String(fu.id)] ?? {};
      sales.forEach((s: any) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          result[String(s.id)][week] += weeksData[week] ?? 0;
        });
      });
    });

    return result;
  }, [followUps, sales, weeks, matrix]);

  const totalsPerSalesWeekly = useMemo(() => {
    const result: Record<string, number> = {};

    sales.forEach((s: any) => {
      result[String(s.id)] = 0;
    });

    followUps.forEach((fu: any) => {
      const row = matrix[String(fu.id)] ?? {};
      sales.forEach((s: any) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          result[String(s.id)] += weeksData[week] ?? 0;
        });
      });
    });

    return result;
  }, [followUps, sales, weeks, matrix]);

  async function exportExcel() {
    const XLSX = await import("xlsx");

    const headerRow = [
      "Jenis Tindak Lanjut",
      ...sales.flatMap((s: any) =>
        weeks.map((w) => `${s.name} W${w.week} (${w.label})`)
      ),
    ];

    const rows: (string | number)[][] = [headerRow];

    followUps.forEach((fu: any) => {
      const row: (string | number)[] = [fu.name];
      const rowData = matrix[String(fu.id)] ?? {};

      sales.forEach((s: any) => {
        const weeksData = rowData[String(s.id)] ?? {};
        weeks.forEach(({ week }) => {
          row.push(weeksData[week] ?? 0);
        });
      });

      rows.push(row);
    });

    // TOTAL PER WEEK
    const totalWeekRow: (string | number)[] = ["TOTAL"];
    sales.forEach((s: any) => {
      weeks.forEach(({ week }) => {
        totalWeekRow.push(totalsPerWeekPerSales[String(s.id)]?.[week] ?? 0);
      });
    });
    rows.push(totalWeekRow);

    // TOTAL PER SALES
    const totalSalesRow: (string | number)[] = ["TOTAL PER SALES"];
    sales.forEach((s: any) => {
      weeks.forEach((_, idx: number) => {
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
    XLSX.utils.book_append_sheet(wb, ws, "Follow Up");

    XLSX.writeFile(wb, `Laporan_FollowUp_${period}.xlsx`);
  }

  return (
    <DashboardLayout title="Laporan Tindak Lanjut">
      <div className="space-y-4">
        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Laporan Tindak Lanjut
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rekap aktivitas tindak lanjut per sales dan per minggu
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-end gap-3 py-3">
          {/* Periode */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Periode
            </span>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                {periodRes?.periods?.map((p: string) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {formatPeriodLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Leader (Manager) */}
          {isManager && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Team Leader
              </span>
              <Select value={teamLeaderId} onValueChange={setTeamLeaderId}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Pilih Team Leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    Semua Team Leader
                  </SelectItem>

                  {tlRes?.data?.map((tl: any) => (
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

          {/* spacer */}
          <div className="flex-1" />

          {/* Export */}
          <Button
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={!followUps.length || !sales.length}
            onClick={exportExcel}
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <CardContent className="px-0">
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <>
              <div className="mb-4">
                <ReportCharts
                  title="Tindak Lanjut"
                  itemType="follow_up"
                  items={followUps}
                  sales={sales}
                  weeks={weeks}
                  matrix={matrix}
                  onSelect={(payload) => {
                    setFilter({
                      ...payload,
                      period,
                    });
                    setModalOpen(true);
                  }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-secondary">
                    <tr>
                      <th rowSpan={2} className="border sticky left-0 z-20 px-3 py-2 text-left bg-secondary">
                        Jenis Follow Up
                      </th>
                      {sales.map((s: any) => (
                        <th
                          key={s.id}
                          colSpan={weeks.length}
                          className="border px-3 py-2 text-center"
                        >
                          {s.name}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {sales.flatMap((s: any) =>
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
                    {followUps.map((fu: any, i: number) => {
                      const row = matrix[String(fu.id)] ?? {};

                      return (
                        <tr
                          key={fu.id}
                          className={cn(
                            "hover:bg-muted-foreground/10",
                            i % 2 === 1 && "bg-muted-foreground/5"
                          )}
                        >
                          <td className="border sticky left-0 z-10 px-3 py-2 font-medium bg-background">
                            {fu.name}
                          </td>

                          {sales.flatMap((s: any) => {
                            const weeksData = row[String(s.id)] ?? {};

                            return weeks.map(({ week }) => {
                              const value = weeksData[week] ?? 0;

                              return (
                                <td
                                  key={`${fu.id}-${s.id}-w${week}`}
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
                    {sales.flatMap((s: any) =>
                      weeks.map(({ week }) => {
                        const v =
                          totalsPerWeekPerSales[String(s.id)]?.[week] ?? 0;
                        return (
                          <td
                            key={`total-${s.id}-w${week}`}
                            className="border px-2 py-1 text-center"
                          >
                            {v > 0 ? v : "-"}
                          </td>
                        );
                      })
                    )}
                  </tr> */}

                    {/* TOTAL PER SALES */}
                    {/* <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL PER SALES</td>
                    {sales.map((s: any) => (
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
