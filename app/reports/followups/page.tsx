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
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FollowUpReportPage() {
  const { user, loading } = useCurrentUser();
  const role = user?.roleCode;

  const isManager = role === "MANAGER";
  const isTeamLeader = role === "TEAM_LEADER";

  const { data: periodRes } = useSWR("/api/reports/stage-periods", fetcher);
  const [period, setPeriod] = useState<string>();
  const [teamLeaderId, setTeamLeaderId] = useState<string>();

  if (!period && periodRes?.defaultPeriod) {
    setPeriod(periodRes.defaultPeriod);
  }

  const { data: tlRes } = useSWR(
    isManager ? "/api/reports/team-leaders" : null,
    fetcher
  );

  const reportUrl = useMemo(() => {
    if (!period) return null;
    if (isManager) {
      if (!teamLeaderId) return null;
      return `/api/reports/followup-by-sales?period=${period}&teamLeaderId=${teamLeaderId}`;
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
  const weeks = data?.data?.weeks ?? [];

  const totalsPerWeekPerSales = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    sales.forEach((s: any) => {
      result[String(s.id)] = {};
      weeks.forEach((w: number) => (result[String(s.id)][w] = 0));
    });

    followUps.forEach((fu: any) => {
      const row = matrix[String(fu.id)] ?? {};
      sales.forEach((s: any) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach((w: number) => {
          result[String(s.id)][w] += weeksData[w] ?? 0;
        });
      });
    });

    return result;
  }, [followUps, sales, weeks, matrix]);

  const totalsPerSalesWeekly = useMemo(() => {
    const result: Record<string, number> = {};

    sales.forEach((s: any) => (result[String(s.id)] = 0));

    followUps.forEach((fu: any) => {
      const row = matrix[String(fu.id)] ?? {};
      sales.forEach((s: any) => {
        const weeksData = row[String(s.id)] ?? {};
        weeks.forEach((w: number) => {
          result[String(s.id)] += weeksData[w] ?? 0;
        });
      });
    });

    return result;
  }, [followUps, sales, weeks, matrix]);

  async function exportExcel() {
    const XLSX = await import("xlsx");

    const headerRow = [
      "Jenis Tindak Lanjut",
      ...sales.flatMap((s: any) => weeks.map((w: number) => `${s.name} W${w}`)),
    ];

    const rows: (string | number)[][] = [headerRow];

    followUps.forEach((fu: any) => {
      const row: (string | number)[] = [fu.name];
      const rowData = matrix[String(fu.id)] ?? {};

      sales.forEach((s: any) => {
        const weeksData = rowData[String(s.id)] ?? {};
        weeks.forEach((w: number) => {
          row.push(weeksData[w] ?? 0);
        });
      });

      rows.push(row);
    });

    // TOTAL PER WEEK
    const totalWeekRow: (string | number)[] = ["TOTAL"];
    sales.forEach((s: any) => {
      weeks.forEach((w: number) => {
        totalWeekRow.push(totalsPerWeekPerSales[String(s.id)]?.[w] ?? 0);
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
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead className="bg-secondary">
                  <tr>
                    <th rowSpan={2} className="border px-3 py-2 text-left">
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
                      weeks.map((w: number) => (
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
                        <td className="border px-3 py-2 font-medium">
                          {fu.name}
                        </td>

                        {sales.flatMap((s: any) => {
                          const weeksData = row[String(s.id)] ?? {};
                          return weeks.map((w: number) => {
                            const value = weeksData[w] ?? 0;
                            return (
                              <td
                                key={`${fu.id}-${s.id}-w${w}`}
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
                  <tr className="bg-primary/70 font-semibold">
                    <td className="border px-3 py-2">TOTAL</td>
                    {sales.flatMap((s: any) =>
                      weeks.map((w: number) => {
                        const v = totalsPerWeekPerSales[String(s.id)]?.[w] ?? 0;
                        return (
                          <td
                            key={`total-${s.id}-w${w}`}
                            className="border px-2 py-1 text-center"
                          >
                            {v > 0 ? v : "-"}
                          </td>
                        );
                      })
                    )}
                  </tr>

                  {/* TOTAL PER SALES */}
                  <tr className="bg-primary/70 font-semibold">
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
