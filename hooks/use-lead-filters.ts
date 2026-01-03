"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export type LeadFilterState = {
  status: string;
  subStatus: string;
  stage: string;
  month: string | null;
  page: number;
  teamLeader?: string;
  sales?: string;
  sort?: "created" | "last_chat" | "unreplied";
};

export function useLeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== READ FROM URL =====
  const filters: LeadFilterState = useMemo(() => {
    return {
      status: searchParams.get("status") ?? "ALL",
      subStatus: searchParams.get("subStatus") ?? "ALL",
      stage: searchParams.get("stage") ?? "ALL",
      month: searchParams.get("month"),
      page: Number(searchParams.get("page") || 1),
      teamLeader: searchParams.get("teamLeader") ?? "ALL",
      sales: searchParams.get("sales") ?? "ALL",
      sort: (searchParams.get("sort") as "created" | "last_chat" | "unreplied") ?? "created",
    };
  }, [searchParams]);

  // ===== UPDATE QUERY PARAMS =====
  const updateFilters = (updates: Partial<LeadFilterState>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return {
    filters,
    setFilters: updateFilters,
  };
}
