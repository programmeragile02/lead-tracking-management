"use client";

import { useState } from "react";
import useSWR from "swr";
import { ProductCard } from "./product-card";
import { ProductTable } from "./product-table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export const PRODUCTS_KEY = "/api/products";

export type Product = {
  id: number;
  category: string;
  name: string;
  description?: string | null;
  photo?: string | null;
  isAvailable: boolean;
  videoDemoUrl?: string | null;
  testimonialUrl?: string | null;
  educationPdfUrl?: string | null;
  educationLinkUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProductApiResponse = {
  ok: boolean;
  data: Product[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const fetcher = (url: string): Promise<ProductApiResponse> =>
  fetch(url).then((res) => res.json());

interface ProductListProps {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  /** optional: kalau mau nanti di-wire dengan search di header */
  searchQuery?: string;
}

export function ProductList({
  onEdit,
  onDelete,
  searchQuery,
}: ProductListProps) {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [viewMode, setViewMode] = useState<"card" | "table">(
    isMobile ? "card" : "table"
  );

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const queryParam = searchQuery?.trim()
    ? `&q=${encodeURIComponent(searchQuery.trim())}`
    : "";

  const apiUrl = `${PRODUCTS_KEY}?page=${page}&pageSize=${pageSize}${queryParam}`;

  const { data, isLoading } = useSWR<ProductApiResponse>(apiUrl, fetcher);

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? products.length;
  const totalPages = data?.meta?.totalPages ?? 1;
  const currentPage = data?.meta?.page ?? page;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle - Hidden on Mobile */}
      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            className={viewMode === "card" ? "gradient-primary text-white" : ""}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kartu
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={
              viewMode === "table" ? "gradient-primary text-white" : ""
            }
          >
            <List className="h-4 w-4 mr-2" />
            Tabel
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Memuat data produk...</div>
      ) : products.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
          Belum ada produk. Tambahkan produk baru terlebih dahulu.
        </div>
      ) : (
        <>
          {viewMode === "card" || isMobile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                />
              ))}
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}

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
                  dari <span className="font-semibold">{total}</span> produk
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
