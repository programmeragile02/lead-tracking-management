"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LeadListCard } from "@/components/leads/lead-list-card";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEADS_API = "/api/leads";
const LEAD_STATUS_API = "/api/lead-statuses";

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
  statusCode: string | null; // COLD/WARM/HOT...
  statusName: string | null;
  createdAt: string; // ISO
  nextActionAt: string | null; // ISO
  followUpTypeName: string | null;
  followUpTypeCode: string | null;
};

type LeadListApiResponse = {
  ok: boolean;
  data: LeadListItem[];
  countsByStatusCode?: Record<string, number>;
  page?: number;
  pageSize?: number;
  hasNext?: boolean;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ---- helper format tanggal / status / indicator ----

function mapStatusCodeToUiStatus(
  code?: string | null
): "hot" | "warm" | "cold" | "new" | "close_won" | "close_lost" {
  const c = (code || "").toUpperCase();
  switch (c) {
    case "HOT":
      return "hot";
    case "WARM":
      return "warm";
    case "COLD":
      return "cold";
    case "CLOSE_WON":
      return "close_won";
    case "CLOSE_LOST":
      return "close_lost";
    case "NEW":
    default:
      return "new";
  }
}

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

// =================== PAGE ===================

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [activeStatusCode, setActiveStatusCode] = useState<string>("ALL"); // ALL / HOT / WARM / ...
  const [page, setPage] = useState(1);

  // ambil master status
  const { data: statusResp } = useSWR<LeadStatusApiResponse>(
    LEAD_STATUS_API,
    fetcher
  );
  const statuses = statusResp?.data ?? [];

  // URL API leads dengan query & filter status
  const searchQuery = search.trim()
    ? `&q=${encodeURIComponent(search.trim())}`
    : "";

  const statusQuery =
    activeStatusCode && activeStatusCode !== "ALL"
      ? `status=${encodeURIComponent(activeStatusCode)}`
      : "status=ALL";

  const leadsUrl = `${LEADS_API}?page=${page}&${statusQuery}${searchQuery}`;

  const { data: leadsResp, isLoading } = useSWR<LeadListApiResponse>(
    leadsUrl,
    fetcher
  );

  const leads = leadsResp?.data ?? [];
  const counts = leadsResp?.countsByStatusCode ?? {};
  const allCount = counts["ALL"] ?? 0;

  const leadsRespPage = leadsResp?.page ?? page;
  const hasNext = leadsResp?.hasNext ?? false;

  return (
    <DashboardLayout title="Lead">
      <div className="space-y-4">
        {/* Search + Filter Bar */}
        <div className="top-0 z-10 bg-background pb-4 space-y-3 pt-1">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, telepon, atau produk..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Filter status (pill) */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Pill: Semua */}
            <button
              type="button"
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border inline-flex items-center",
                activeStatusCode === "ALL"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-red-50 text-red-700 border-red-100"
              )}
              onClick={() => {
                setActiveStatusCode("ALL");
                setPage(1);
              }}
            >
              <span>Semua</span>
              <span
                className={cn(
                  "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                  activeStatusCode === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-700"
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
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-red-50 text-red-700 border-red-100"
                  )}
                  onClick={() => {
                    setActiveStatusCode(st.code);
                    setPage(1);
                  }}
                >
                  <span>{st.name}</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-gray-500">Memuat data lead...</div>
          ) : leads.length === 0 ? (
            <div className="border border-dashed rounded-xl p-6 text-center text-gray-500 text-sm">
              Belum ada lead untuk filter & pencarian ini.
            </div>
          ) : (
            leads.map((lead) => {
              const uiStatus = mapStatusCodeToUiStatus(lead.statusCode);
              const createdLabel = formatRelativeCreatedAt(lead.createdAt);
              const ageLabel = computeLeadAgeLabel(lead.createdAt);
              const nextLabel = formatNextFollowUp(lead.nextActionAt);
              const indicator = computeIndicator(lead.nextActionAt);

              return (
                <LeadListCard
                  key={lead.id}
                  leadId={lead.id}
                  leadName={lead.name}
                  status={uiStatus}
                  product={lead.productName || "Tanpa produk"}
                  channel={lead.sourceName || "Tanpa sumber"}
                  createdDate={createdLabel}
                  leadAge={ageLabel}
                  nextFollowUp={nextLabel}
                  followUpType={lead.followUpTypeName || undefined}
                  indicator={indicator}
                />
              );
            })
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Halaman {leadsRespPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={leadsRespPage <= 1}
                onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
