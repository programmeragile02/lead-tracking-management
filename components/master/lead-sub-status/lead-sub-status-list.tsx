"use client";

import useSWR from "swr";
import { LeadSubStatusTable } from "./lead-sub-status-table";

export const LEAD_SUB_STATUSES_KEY = "/api/lead-sub-statuses";

export type LeadSubStatus = {
  id: number;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
  status: {
    id: number;
    name: string;
    code: string;
  };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LeadSubStatusList({
  onEdit,
  onDelete,
}: {
  onEdit: (s: LeadSubStatus) => void;
  onDelete: (s: LeadSubStatus) => void;
}) {
  const { data, isLoading } = useSWR(LEAD_SUB_STATUSES_KEY, fetcher);

  const items: LeadSubStatus[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Memuat sub status...</div>
    );
  }

  if (!items.length) {
    return (
      <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
        Belum ada sub status. Tambahkan terlebih dahulu
      </div>
    );
  }

  return (
    <LeadSubStatusTable items={items} onEdit={onEdit} onDelete={onDelete} />
  );
}
