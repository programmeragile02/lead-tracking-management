"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { LeadStatusTable } from "./lead-status-table";

export const LEAD_STATUSES_KEY = "/api/lead-statuses";

export type LeadStatus = {
  id: number;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeadStatusApiResponse = {
  ok: boolean;
  data: LeadStatus[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const fetcher = (url: string): Promise<LeadStatusApiResponse> =>
  fetch(url).then((res) => res.json());

interface LeadStatusListProps {
  onEdit: (status: LeadStatus) => void;
  onDelete: (status: LeadStatus) => void;
  searchQuery?: string;
}

export function LeadStatusList({
  onEdit,
  onDelete,
  searchQuery,
}: LeadStatusListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const q = searchQuery?.trim() || "";
  const queryParam = q ? `&q=${encodeURIComponent(q)}` : "";

  const apiUrl = `${LEAD_STATUSES_KEY}?page=${page}&pageSize=${pageSize}${queryParam}`;

  const { data, isLoading } = useSWR<LeadStatusApiResponse>(apiUrl, fetcher);

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
        <div className="text-sm text-gray-500">Memuat data status lead...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
          Belum ada data status lead. Tambahkan status baru terlebih dahulu.
        </div>
      ) : (
        <>
          <LeadStatusTable
            statuses={items}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 text-sm">
            <div className="text-gray-500">
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
                  dari <span className="font-semibold">{total}</span> status
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

              <span className="text-gray-600">
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
