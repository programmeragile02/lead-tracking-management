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

  async function exportExcel() {
    const XLSX = await import("xlsx");

    const rows: (string | number)[][] = [
      ["Jenis Tindak Lanjut", ...sales.map((s: any) => s.name)],
    ];

    followUps.forEach((fu: any) => {
      const row = [fu.name];
      sales.forEach((s: any) =>
        row.push(matrix[String(fu.id)]?.[String(s.id)] ?? 0)
      );
      rows.push(row);
    });

    rows.push([]);
    rows.push(["TOTAL", ...sales.map((s: any) => totals[String(s.id)] ?? 0)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Follow Up");
    XLSX.writeFile(wb, `Laporan_FollowUp_${period}.xlsx`);
  }

  return (
    <DashboardLayout title="Laporan Tindak Lanjut">
      <div className="space-y-4">
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodRes?.periods?.map((p: string) => (
                  <SelectItem key={p} value={p}>
                    {formatPeriodLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isManager && (
              <Select value={teamLeaderId} onValueChange={setTeamLeaderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Team Leader" />
                </SelectTrigger>
                <SelectContent>
                  {tlRes?.data?.map((tl: any) => (
                    <SelectItem key={tl.id} value={String(tl.id)}>
                      {tl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Laporan Tindak Lanjut</CardTitle>
            <Button size="sm" variant="outline" onClick={exportExcel}>
              <FileDown className="w-4 h-4 mr-1" /> Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border px-3 py-2 text-left">
                        Jenis Follow Up
                      </th>
                      {sales.map((s: any) => (
                        <th key={s.id} className="border px-3 py-2 text-center">
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.map((fu: any, i: number) => (
                      <tr
                        key={fu.id}
                        className={cn(
                          "hover:bg-primary",
                          i % 2 && "bg-muted-foreground/30"
                        )}
                      >
                        <td className="border px-3 py-2 font-medium">
                          {fu.name}
                        </td>
                        {sales.map((s: any) => (
                          <td
                            key={s.id}
                            className="border px-3 py-2 text-center"
                          >
                            {matrix[String(fu.id)]?.[String(s.id)] ?? "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-primary font-semibold">
                      <td className="border px-3 py-2">TOTAL</td>
                      {sales.map((s: any) => (
                        <td key={s.id} className="border px-3 py-2 text-center">
                          {totals[String(s.id)] ?? 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
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