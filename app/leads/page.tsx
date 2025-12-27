"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LeadListCard } from "@/components/leads/lead-list-card";
import { Calendar1, Download, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { io as ioClient } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLeadFilters } from "@/hooks/use-lead-filters";
import { getStatusClass } from "@/lib/lead-status";

const LEADS_API = "/api/leads";
const LEAD_STATUS_API = "/api/lead-statuses";
const SUB_STATUS_API = "/api/lead-sub-statuses";

// ---- Types dari API ----
type LeadStatusMaster = {
  id: number;
  code: string; // COLD/WARM/HOT/NEW/CLOSED
  name: string; // Cold / Warm / Hot ...
};

type LeadStatusApiResponse = {
  ok: boolean;
  data: LeadStatusMaster[];
};

type LeadListItem = {
  id: number;
  name: string;
  productName: string | null;
  sourceName: string | null;
  salesName?: string | null;
  teamLeaderName?: string | null;
  statusCode: string | null; // COLD/WARM/HOT...
  statusName: string | null;
  createdAt: string; // ISO
  nextActionAt: string | null; // ISO
  followUpTypeName: string | null;
  followUpTypeCode: string | null;
  nurturingEnabled?: boolean;
  importedFromExcel?: boolean;
};

type LeadListApiResponse = {
  ok: boolean;
  data: LeadListItem[];
  countsByStatusCode?: Record<string, number>;
  countsBySubStatusCode?: Record<string, number>;
  page?: number;
  pageSize?: number;
  hasNext?: boolean;
  totalPages: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ---- helper format tanggal / indicator ----

function formatRelativeCreatedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNextFollowUp(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Hari ini, ${timeStr}`;
  if (isTomorrow) return `Besok, ${timeStr}`;

  const dateStr = d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return `${dateStr}, ${timeStr}`;
}

function computeIndicator(
  nextActionAt: string | null
): "overdue" | "due-today" | "updated" | "normal" {
  if (!nextActionAt) return "normal";
  const d = new Date(nextActionAt);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "due-today";
  if (d < now) return "overdue";
  return "normal";
}

// helper umur lead
function computeLeadAgeLabel(iso: string): string {
  const created = new Date(iso);
  const now = new Date();

  const diffMs = now.getTime() - created.getTime();
  if (diffMs <= 0) return "< 1 hari";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "< 1 hari";
  if (diffDays < 30) return `${diffDays} hari`;

  const months = Math.floor(diffDays / 30);
  const daysRemainder = diffDays % 30;

  if (daysRemainder === 0) {
    return `${months} bln`;
  }

  return `${months} bln ${daysRemainder} hari`;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
  return new Date(month + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

// =================== PAGE ===================

export default function LeadsPage() {
  const { toast } = useToast();

  const { filters, setFilters } = useLeadFilters();

  const {
    status: activeStatusCode,
    subStatus: activeSubStatusCode,
    stage: activeStageId,
    month: activeMonth,
    page,
    teamLeader: activeTeamLeaderId,
    sales: activeSalesId,
  } = filters;

  const [search, setSearch] = useState("");

  // useEffect(() => {
  //   setActiveStageId("ALL");
  // }, [activeStatusCode, activeSubStatusCode]);

  // ambil master status
  const { data: statusResp } = useSWR<LeadStatusApiResponse>(
    LEAD_STATUS_API,
    fetcher
  );
  const statuses = statusResp?.data ?? [];

  const { data: subStatusResp } = useSWR(
    activeStatusCode !== "ALL"
      ? `${SUB_STATUS_API}?statusCode=${activeStatusCode}`
      : null,
    fetcher
  );
  const subStatuses = subStatusResp?.data ?? [];

  const { data: stageResp } = useSWR(
    activeSubStatusCode !== "ALL"
      ? `/api/lead-filters/stages?statusCode=${activeStatusCode}&subStatusCode=${activeSubStatusCode}`
      : null,
    fetcher
  );

  const stages = stageResp?.data ?? [];

  // URL API leads dengan query & filter status
  const searchQuery = search.trim()
    ? `&q=${encodeURIComponent(search.trim())}`
    : "";

  const statusQuery =
    activeStatusCode && activeStatusCode !== "ALL"
      ? `status=${encodeURIComponent(activeStatusCode)}`
      : "status=ALL";

  const subStatusQuery =
    activeSubStatusCode && activeSubStatusCode !== "ALL"
      ? `&subStatus=${encodeURIComponent(activeSubStatusCode)}`
      : "";

  const hierarchyQuery = [
    activeTeamLeaderId !== "ALL" ? `teamLeaderId=${activeTeamLeaderId}` : null,
    activeSalesId !== "ALL" ? `salesId=${activeSalesId}` : null,
  ]
    .filter(Boolean)
    .join("&");

  const monthQuery = activeMonth
    ? `&month=${encodeURIComponent(activeMonth)}`
    : "";

  const stageQuery = activeStageId !== "ALL" ? `&stageId=${activeStageId}` : "";

  const sortQuery = filters.sort ? `&sort=${filters.sort}` : "";

  const leadsUrl = `${LEADS_API}?page=${page}${sortQuery}&${statusQuery}${subStatusQuery}${stageQuery}${searchQuery}${monthQuery}${
    hierarchyQuery ? `&${hierarchyQuery}` : ""
  }`;

  const {
    data: leadsResp,
    isLoading,
    mutate: mutateLeads,
  } = useSWR<LeadListApiResponse>(leadsUrl, fetcher);

  const leads = leadsResp?.data ?? [];
  const counts = leadsResp?.countsByStatusCode ?? {};
  const allCount = counts["ALL"] ?? 0;

  const leadsRespPage = leadsResp?.page ?? page;
  const hasNext = leadsResp?.hasNext ?? false;

  const subCounts = leadsResp?.countsBySubStatusCode ?? {};

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

  const { user } = useCurrentUser();

  const { data: tlResp } = useSWR(
    user?.roleSlug === "manager" ? "/api/users/team-leaders" : null,
    fetcher
  );
  const teamLeaders = tlResp?.data ?? [];

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

  const tlCountUrl =
    user?.roleSlug === "manager"
      ? `/api/leads/count-by-team-leader${
          activeMonth ? `?month=${activeMonth}` : ""
        }`
      : null;

  const { data: tlCountResp } = useSWR(tlCountUrl, fetcher);

  const tlCounts = tlCountResp?.data ?? {};
  const totalTL = tlCountResp?.total ?? 0;

  // ===== SALES COUNT (badge) =====
  const salesCountUrl =
    user?.roleSlug === "manager"
      ? activeTeamLeaderId !== "ALL"
        ? `/api/leads/count-by-sales?teamLeaderId=${activeTeamLeaderId}${
            activeMonth ? `&month=${activeMonth}` : ""
          }`
        : activeMonth
        ? `/api/leads/count-by-sales?month=${activeMonth}`
        : "/api/leads/count-by-sales"
      : user?.roleSlug === "team-leader"
      ? `/api/leads/count-by-sales${activeMonth ? `?month=${activeMonth}` : ""}`
      : null;

  const { data: salesCountResp } = useSWR(salesCountUrl, fetcher);

  const salesCounts: Record<number, number> = salesCountResp?.data ?? {};
  const totalSales: number = salesCountResp?.total ?? 0;

  useEffect(() => {
    if (!user?.id) return;

    const s = ioClient(SOCKET_URL, {
      transports: ["websocket"],
    });

    // join room user
    s.emit("join", { userId: user.id });

    s.on("lead_list_changed", (payload) => {
      mutateLeads();

      if (!payload?.type) return;

      // UX kecil tapi kerasa
      if (payload.type === "ASSIGN_ACTIVITY") {
        toast({
          title: "Lead berhasil dialihkan",
          description: payload.leadName
            ? `Lead ${payload.leadName} dialihkan ke sales ${payload.toSalesName}`
            : "Lead berhasil dialihkan",
        });
      }

      if (payload.type === "ASSIGNED_TO_YOU") {
        toast({
          title: "Lead baru",
          description: payload.leadName
            ? `Lead ${payload.leadName} dialihkan ke Anda`
            : "Ada lead baru dialihkan ke Anda",
        });
      }

      if (payload.type === "REMOVED_FROM_YOU") {
        toast({
          title: "Lead dialihkan",
          description: payload.leadName
            ? `Lead ${payload.leadName} dialihkan ke sales ${payload.toSalesName}`
            : "Lead anda dialihkan",
          variant: "default",
        });
      }
    });

    return () => {
      s.emit("leave", { userId: user.id });
      s.disconnect();
    };
  }, [user?.id, mutateLeads]);

  const totalPages = leadsResp?.totalPages ?? 1;

  return (
    <DashboardLayout title="Lead">
      <div className="space-y-4">
        {/* Search + Filter Bar */}
        <div className="top-0 z-10 bg-background space-y-3 pt-1">
          {user?.roleSlug === "manager" && teamLeaders.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {/* Semua TL */}
              <button
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border inline-flex items-center",
                  activeTeamLeaderId === "ALL"
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary text-muted-foreground"
                )}
                onClick={() => {
                  setFilters({
                    teamLeader: "ALL",
                    sales: "ALL",
                    page: 1,
                  });
                }}
              >
                <span>Semua TL</span>
                <span
                  className={cn(
                    "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                    activeTeamLeaderId === "ALL"
                      ? "bg-white/20 text-white"
                      : "bg-muted-foreground text-secondary"
                  )}
                >
                  {totalTL}
                </span>
              </button>

              {teamLeaders.map((tl: any) => {
                const count = tlCounts[tl.id] ?? 0;
                const isActive = activeTeamLeaderId === String(tl.id);

                return (
                  <button
                    key={tl.id}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium border inline-flex items-center",
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                    onClick={() => {
                      setFilters({
                        teamLeader: tl.id,
                        sales: "ALL",
                        page: 1,
                      });
                    }}
                  >
                    <span>{tl.name}</span>
                    <span
                      className={cn(
                        "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted-foreground text-secondary"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {(user?.roleSlug === "manager" || user?.roleSlug === "team-leader") &&
            salesList.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 pl-1">
                {/* Semua Sales */}
                <button
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                    activeSalesId === "ALL"
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                  onClick={() => {
                    setFilters({
                      sales: "ALL",
                      page: 1,
                    });
                  }}
                >
                  <span>Semua Sales</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]",
                      activeSalesId === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-muted-foreground text-secondary"
                    )}
                  >
                    {totalSales}
                  </span>
                </button>

                {salesList.map((s: any) => {
                  const count = salesCounts[s.id] ?? 0;
                  const isActive = activeSalesId === String(s.id);

                  return (
                    <button
                      key={s.id}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                      onClick={() => {
                        setFilters({
                          sales: s.id,
                          page: 1,
                        });
                      }}
                    >
                      <span>{s.name}</span>
                      <span
                        className={cn(
                          "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-muted-foreground text-secondary"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          {/* Search */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, telepon, atau produk..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFilters({
                    page: 1,
                  });
                }}
              />
            </div>

            {/* FILTER SORTING */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={filters.sort === "last_chat" ? "default" : "outline"}
                  size="icon"
                  title="Urutkan lead"
                  className="w-11 h-11"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  <button
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm",
                      filters.sort === "created" && "bg-primary text-white"
                    )}
                    onClick={() => setFilters({ sort: "created", page: 1 })}
                  >
                    🕒 Lead masuk terbaru
                  </button>

                  <button
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm",
                      filters.sort === "last_chat" && "bg-primary text-white"
                    )}
                    onClick={() => setFilters({ sort: "last_chat", page: 1 })}
                  >
                    💬 Chat terakhir
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* FILTER BULAN */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={activeMonth ? "default" : "outline"}
                  size="icon"
                  title="Filter bulan"
                  className="w-11 h-11"
                >
                  <Calendar1 className="h-4 w-4 text-foreground" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-56 p-3 mr-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Filter Bulan</div>

                  {/* INPUT TETAP ADA TAPI KECIL */}
                  <input
                    type="month"
                    className="
                      w-full rounded-md border
                      px-2 py-1.5 text-sm
                      scheme-dark
                    "
                    value={activeMonth ?? ""}
                    onChange={(e) => {
                      setFilters({ month: e.target.value, page: 1 });
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilters({
                        month: getCurrentMonth(),
                        page: 1,
                      });
                    }}
                  >
                    Bulan ini
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {user?.roleSlug === "sales" && (
              <ImportLeadsDialog
                onImported={async () => {
                  setFilters({ page: 1 });
                  await mutateLeads();
                }}
              />
            )}

            <Button
              variant="default"
              onClick={() => {
                const params = new URLSearchParams();

                if (filters.status !== "ALL")
                  params.set("status", filters.status);
                if (filters.subStatus !== "ALL")
                  params.set("subStatus", filters.subStatus);
                if (filters.stage !== "ALL") params.set("stage", filters.stage);
                if (filters.teamLeader !== "ALL")
                  params.set("teamLeader", filters.teamLeader);
                if (filters.sales !== "ALL") params.set("sales", filters.sales);
                if (filters.month) params.set("month", filters.month);

                window.open(`/api/leads/export?${params.toString()}`, "_blank");
              }}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>

          {/* Filter status (pill) */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Pill: Semua */}
            <button
              type="button"
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border inline-flex items-center",
                activeStatusCode === "ALL"
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary text-muted-foreground"
              )}
              onClick={() => {
                setFilters({
                  status: "ALL",
                  page: 1,
                });
              }}
            >
              <span>Semua</span>
              <span
                className={cn(
                  "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                  activeStatusCode === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-muted-foreground text-secondary"
                )}
              >
                {allCount}
              </span>
            </button>

            {/* Pill: per status dari master */}
            {statuses.map((st) => {
              const isActive = activeStatusCode === st.code;
              const count = counts[st.code] ?? 0;

              return (
                <button
                  key={st.id}
                  type="button"
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium border inline-flex items-center",
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                  onClick={() => {
                    setFilters({
                      status: st.code,
                      subStatus: "ALL",
                      page: 1,
                    });
                  }}
                >
                  <span>{st.name}</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted-foreground text-secondary"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {/* SUB STATUS */}
          {activeStatusCode !== "ALL" && subStatuses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pl-1">
              {/* Semua Sub */}
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                  activeSubStatusCode === "ALL"
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary text-muted-foreground"
                )}
                onClick={() => {
                  setFilters({
                    subStatus: "ALL",
                    page: 1,
                  });
                }}
              >
                <span>Semua</span>
                <span
                  className={cn(
                    "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]",
                    activeSubStatusCode === "ALL"
                      ? "bg-white/20 text-white"
                      : "bg-muted-foreground text-secondary"
                  )}
                >
                  {Object.values(subCounts).reduce((a, b) => a + b, 0)}
                </span>
              </button>

              {subStatuses.map((ss: any) => {
                const isActive = activeSubStatusCode === ss.code;
                const count = subCounts[ss.code] ?? 0;

                return (
                  <button
                    key={ss.id}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                    onClick={() => {
                      setFilters({
                        subStatus: ss.code,
                        page: 1,
                      });
                    }}
                  >
                    <span>{ss.name}</span>
                    <span
                      className={cn(
                        "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted-foreground text-secondary"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ====== STAGE FILTER ====== */}
          {activeSubStatusCode !== "ALL" && stages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pl-1">
              {/* Semua Tahap */}
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                  activeStageId === "ALL"
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary text-muted-foreground"
                )}
                onClick={() => {
                  setFilters({
                    stage: "ALL",
                    page: 1,
                  });
                }}
              >
                <span>Semua Tahap</span>
              </button>

              {stages.map((stg: any) => {
                const isActive = activeStageId === String(stg.id);

                return (
                  <button
                    key={stg.id}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center",
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                    onClick={() => {
                      setFilters({
                        stage: stg.id,
                        page: 1,
                      });
                    }}
                  >
                    <span>{stg.name}</span>

                    {/* BADGE JUMLAH */}
                    {/* <span
                      className={cn(
                        "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted-foreground text-secondary"
                      )}
                    >
                      {stg.count}
                    </span> */}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {activeMonth && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span>Periode:</span>
            <span className="font-medium text-foreground">
              {formatMonthLabel(activeMonth)}
            </span>
          </div>
        )}

        {/* Lead List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Memuat data lead...</div>
          ) : leads.length === 0 ? (
            <div className="border border-dashed rounded-xl p-6 text-center text-gray-500 text-sm">
              Belum ada lead untuk filter & pencarian ini.
            </div>
          ) : (
            leads.map((lead) => {
              const statusLabel =
                lead.statusName ?? lead.statusCode ?? "UNKNOWN";
              const createdLabel = new Date(lead.createdAt).toLocaleDateString(
                "id-ID",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              );

              const ageLabel = computeLeadAgeLabel(lead.createdAt);
              const nextLabel = formatNextFollowUp(lead.nextActionAt);
              const indicator = computeIndicator(lead.nextActionAt);

              return (
                <LeadListCard
                  key={lead.id}
                  leadId={lead.id}
                  leadName={lead.name}
                  statusCode={lead.statusCode}
                  statusLabel={statusLabel}
                  product={lead.productName || "Tanpa produk"}
                  channel={lead.sourceName || "Tanpa sumber"}
                  createdDate={createdLabel}
                  leadAge={ageLabel}
                  nextFollowUp={nextLabel}
                  followUpType={lead.followUpTypeName || undefined}
                  indicator={indicator}
                  nurturingEnabled={lead.nurturingEnabled}
                  importedFromExcel={!!lead.importedFromExcel}
                  salesName={lead.salesName}
                  teamLeaderName={lead.teamLeaderName}
                />
              );
            })
          )}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <div className="text-sm text-muted-foreground">
            Halaman {page} / {totalPages}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilters({ page: Math.max(1, page - 1) })}
            >
              Sebelumnya
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setFilters({ page: page + 1 })}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
