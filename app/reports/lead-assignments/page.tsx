"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssignmentCard } from "@/components/reports/assigment-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeadAssignmentReportPage() {
  const { user } = useCurrentUser();

  const [search, setSearch] = useState("");
  const [activeTeamLeaderId, setActiveTeamLeaderId] = useState("ALL");
  const [activeSalesId, setActiveSalesId] = useState("ALL");
  const [page, setPage] = useState(1);

  // =========================
  // DATA TEAM LEADER (MANAGER)
  // =========================
  const { data: tlResp } = useSWR(
    user?.roleSlug === "manager" ? "/api/users/team-leaders" : null,
    fetcher
  );
  const teamLeaders = tlResp?.data ?? [];

  // =========================
  // DATA SALES (CASCADE)
  // =========================
  const salesUrl =
    user?.roleSlug === "manager"
      ? activeTeamLeaderId !== "ALL"
        ? `/api/users/sales?teamLeaderId=${activeTeamLeaderId}`
        : null
      : user?.roleSlug === "team-leader"
      ? "/api/users/sales"
      : null;

  const { data: salesResp } = useSWR(salesUrl, fetcher);
  const salesList = salesResp?.data ?? [];

  // =========================
  // API URL
  // =========================
  const apiUrl =
    `/api/reports/lead-assignments?page=${page}` +
    (search ? `&q=${encodeURIComponent(search)}` : "") +
    (user?.roleSlug === "manager" && activeTeamLeaderId !== "ALL"
      ? `&teamLeaderId=${activeTeamLeaderId}`
      : "") +
    (activeSalesId !== "ALL" ? `&salesId=${activeSalesId}` : "");

  const { data, isLoading } = useSWR(apiUrl, fetcher);

  const rows = data?.data ?? [];
  const hasNext = data?.hasNext ?? false;

  // =========================
  // UI
  // =========================
  return (
    <DashboardLayout title="Laporan Assignment Lead">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Laporan Assignment Lead</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Informasi dan history pemindahan lead ke sales A ke sales B
          </p>
        </div>
        {/* ================= SEARCH ================= */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari lead, sales, atau yang memindahkan..."
            className="pl-10 h-11"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* ================= FILTER TL (MANAGER) ================= */}
        {user?.roleSlug === "manager" && teamLeaders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              active={activeTeamLeaderId === "ALL"}
              label="Semua Team Leader"
              onClick={() => {
                setActiveTeamLeaderId("ALL");
                setActiveSalesId("ALL");
                setPage(1);
              }}
            />

            {teamLeaders.map((tl: any) => (
              <FilterPill
                key={tl.id}
                active={activeTeamLeaderId === String(tl.id)}
                label={tl.name}
                onClick={() => {
                  setActiveTeamLeaderId(String(tl.id));
                  setActiveSalesId("ALL");
                  setPage(1);
                }}
              />
            ))}
          </div>
        )}

        {/* ================= FILTER SALES ================= */}
        {salesList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              active={activeSalesId === "ALL"}
              label="Semua Sales"
              onClick={() => {
                setActiveSalesId("ALL");
                setPage(1);
              }}
            />

            {salesList.map((s: any) => (
              <FilterPill
                key={s.id}
                active={activeSalesId === String(s.id)}
                label={s.name}
                onClick={() => {
                  setActiveSalesId(String(s.id));
                  setPage(1);
                }}
              />
            ))}
          </div>
        )}

        {/* ================= LIST ================= */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Memuat data assignment...
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
            Tidak ada data assignment untuk filter ini
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row: any) => (
              <AssignmentCard key={row.id} row={row} />
            ))}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// =========================
// FILTER PILL
// =========================
function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap",
        active
          ? "bg-primary text-white border-primary"
          : "bg-secondary text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
