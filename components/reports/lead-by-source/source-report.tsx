"use client";

import useSWR from "swr";
import { useState } from "react";
import { SourceBarChart } from "./source-bar-chart";
import { SourcePieChart } from "./source-pie-chart";
import { SourceSummaryTable } from "./source-summary-table";
import { SourceFilters } from "./source-filters";
import { Card } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SourceReport() {
  const { user, loading } = useCurrentUser();

  const [teamLeaderId, setTeamLeaderId] = useState("ALL");
  const [salesId, setSalesId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  /** ===============================
   * BUILD QUERY
   * =============================== */
  const query = new URLSearchParams();
  if (teamLeaderId !== "ALL") query.set("teamLeaderId", teamLeaderId);
  if (salesId !== "ALL") query.set("salesId", salesId);
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const { data, isLoading } = useSWR(
    user ? `/api/reports/leads/by-source?${query.toString()}` : null,
    fetcher
  );

  /** ===============================
   * CONDITIONAL RENDER (SETELAH HOOK)
   * =============================== */
  if (loading) {
    return <div className="text-sm text-muted-foreground">Memuat user…</div>;
  }

  if (!user) {
    return (
      <div className="text-sm text-destructive">User tidak terautentikasi</div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Memuat laporan…</div>;
  }

  if (!data?.ok) {
    return (
      <div className="text-sm text-destructive">Gagal memuat data laporan</div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* FILTER */}
      <SourceFilters
        roleSlug={user.roleSlug}
        teamLeaderId={teamLeaderId}
        salesId={salesId}
        from={from}
        to={to}
        onChange={(v) => {
          if (v.teamLeaderId !== undefined) setTeamLeaderId(v.teamLeaderId);
          if (v.salesId !== undefined) setSalesId(v.salesId);
          if (v.from !== undefined) setFrom(v.from);
          if (v.to !== undefined) setTo(v.to);
        }}
      />

      {/* PERIODE */}
      {(from || to) && (
        <div className="text-sm text-muted-foreground">
          Periode:{" "}
          <span className="font-medium text-foreground">
            {from || "Awal"} – {to || "Sekarang"}
          </span>
        </div>
      )}

      {/* SUMMARY */}
      <div className="text-sm text-muted-foreground">
        Total Lead:{" "}
        <span className="font-medium text-foreground">{data.totalLeads}</span>
      </div>

      {/* CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Jumlah Lead per Channel</h3>
          <SourceBarChart data={data.data} />
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Distribusi Lead per Channel</h3>
          <SourcePieChart data={data.data} />
        </Card>
      </div>

      {/* TABLE */}
      <div>
        <h3 className="mb-3 font-semibold">Ringkasan Lead per Channel</h3>
        <SourceSummaryTable data={data.data} />
      </div>
    </div>
  );
}
