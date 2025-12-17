"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { LeadStageTable } from "./lead-stage-table";

export const LEAD_STAGES_KEY = "/api/lead-stages";

export type LeadStage = {
  id: number;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeadStageApiResponse = {
  ok: boolean;
  data: LeadStage[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const fetcher = (url: string): Promise<LeadStageApiResponse> =>
  fetch(url).then((res) => res.json());

interface LeadStageListProps {
  onEdit: (stage: LeadStage) => void;
  onDelete: (stage: LeadStage) => void;
  searchQuery?: string;
}

export function LeadStageList({
  onEdit,
  onDelete,
  searchQuery,
}: LeadStageListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const q = searchQuery?.trim() || "";
  const queryParam = q ? `&q=${encodeURIComponent(q)}` : "";

  const apiUrl = `${LEAD_STAGES_KEY}?page=${page}&pageSize=${pageSize}${queryParam}`;

  const { data, isLoading } = useSWR<LeadStageApiResponse>(apiUrl, fetcher);

  const stages = data?.data ?? [];
  const total = data?.meta?.total ?? stages.length;
  const totalPages = data?.meta?.totalPages ?? 1;
  const currentPage = data?.meta?.page ?? page;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat data tahap...</div>
      ) : stages.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
          Belum ada data tahap. Tambahkan tahap baru terlebih dahulu.
        </div>
      ) : (
        <>
          <LeadStageTable stages={stages} onEdit={onEdit} onDelete={onDelete} />

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
                  dari <span className="font-semibold">{total}</span> tahap
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
