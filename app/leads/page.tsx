// app/leads/page.tsx
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

// =================== PAGE ===================

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [activeStatusCode, setActiveStatusCode] = useState<string>("ALL"); // ALL / HOT / WARM / ...

  // ambil master status
  const { data: statusResp } = useSWR<LeadStatusApiResponse>(
    LEAD_STATUS_API,
    fetcher
  );
  const statuses = statusResp?.data ?? [];

  // URL API leads dengan query & filter status
  const queryParam = search.trim()
    ? `&q=${encodeURIComponent(search.trim())}`
    : "";
  const statusParam =
    activeStatusCode && activeStatusCode !== "ALL"
      ? `&status=${encodeURIComponent(activeStatusCode)}`
      : "&status=ALL";

  const leadsUrl = `${LEADS_API}?${statusParam.slice(1)}${queryParam}`;

  const { data: leadsResp, isLoading } = useSWR<LeadListApiResponse>(
    leadsUrl,
    fetcher
  );

  const leads = leadsResp?.data ?? [];

  return (
    <DashboardLayout title="Lead" role="sales">
      <div className="space-y-4">
        {/* Search + Filter Bar */}
        <div className="sticky top-0 z-10 bg-background pb-4 space-y-3 pt-1">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, telepon, atau produk..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter status (pill) */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border",
                activeStatusCode === "ALL"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-red-50 text-red-700 border-red-100"
              )}
              onClick={() => setActiveStatusCode("ALL")}
            >
              Semua
            </button>

            {statuses.map((st) => (
              <button
                key={st.id}
                type="button"
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border",
                  activeStatusCode === st.code
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-red-50 text-red-700 border-red-100"
                )}
                onClick={() => setActiveStatusCode(st.code)}
              >
                {st.name}
              </button>
            ))}
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
              const nextLabel = formatNextFollowUp(lead.nextActionAt);
              const indicator = computeIndicator(lead.nextActionAt);

              return (
                <LeadListCard
                  key={lead.id}
                  leadName={lead.name}
                  status={uiStatus}
                  product={lead.productName || "Tanpa produk"}
                  channel={lead.sourceName || "Tanpa sumber"}
                  createdDate={createdLabel}
                  nextFollowUp={nextLabel}
                  followUpType={lead.followUpTypeName || undefined}
                  indicator={indicator}
                />
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
