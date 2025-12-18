"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { LeadSourceTable } from "./lead-source-table";

export const LEAD_SOURCES_KEY = "/api/lead-sources";

export type LeadSource = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeadSourceApiResponse = {
  ok: boolean;
  data: LeadSource[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const fetcher = (url: string): Promise<LeadSourceApiResponse> =>
  fetch(url).then((res) => res.json());

interface LeadSourceListProps {
  onEdit: (item: LeadSource) => void;
  onDelete: (item: LeadSource) => void;
  searchQuery?: string;
}

export function LeadSourceList({
  onEdit,
  onDelete,
  searchQuery,
}: LeadSourceListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const q = searchQuery?.trim() || "";
  const queryParam = q ? `&q=${encodeURIComponent(q)}` : "";

  const apiUrl = `${LEAD_SOURCES_KEY}?page=${page}&pageSize=${pageSize}${queryParam}`;

  const { data, isLoading } = useSWR<LeadSourceApiResponse>(apiUrl, fetcher);

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;
  const totalPages = data?.meta?.totalPages ?? 1;
  const currentPage = data?.meta?.page ?? page;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat data sumber lead...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
          Belum ada data sumber lead. Tambahkan sumber baru terlebih dahulu.
        </div>
      ) : (
        <>
          <LeadSourceTable items={items} onEdit={onEdit} onDelete={onDelete} />

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 text-sm">
            <div className="text-muted-foreground">
              {total > 0 && (
                <>
                  Menampilkan{" "}
                  <span className="font-semibold">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{" "}
                  dari <span className="font-semibold">{total}</span> sumber
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Sebelumnya
              </Button>

              <span className="text-muted-foreground">
                Halaman <span className="font-semibold">{currentPage}</span> /{" "}
                {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
