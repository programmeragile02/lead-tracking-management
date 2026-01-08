"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { CityTable } from "./city-table";
import { CityDialog } from "./city-dialog";
import type { City } from "@/types/region-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const API_KEY = "/api/master/cities";
const PROVINCE_KEY = "/api/master/provinces";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CityList() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  const pageSize = 10;
  const q = search.trim();

  const url = `${API_KEY}?page=${page}&pageSize=${pageSize}${
    q ? `&q=${encodeURIComponent(q)}` : ""
  }`;

  const { data, isLoading } = useSWR(url, fetcher);
  const { data: provinceData } = useSWR(PROVINCE_KEY, fetcher);

  const items: City[] = data?.data ?? [];
  const meta = data?.meta;

  const provinces =
    provinceData?.data?.map((p: any) => ({
      id: p.id,
      name: p.name,
    })) ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (city: City) => {
    setEditing(city);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/master/cities/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menghapus kota");
      }

      toast({
        title: "Berhasil",
        description: `Kota "${deleteTarget.name}" berhasil dihapus`,
      });

      setDeleteTarget(null);
      await mutate((key) => typeof key === "string" && key.startsWith(API_KEY));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Daftar Kota / Kabupaten</h3>
          <p className="text-sm text-muted-foreground">
            Digunakan sebagai lokasi pada data lead.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kota
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama / kode kota..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat data kota...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          Belum ada data kota / kabupaten.
        </div>
      ) : (
        <>
          <CityTable
            cities={items}
            onEdit={openEdit}
            onDelete={(c) => setDeleteTarget(c)}
          />

          {/* Pagination */}
          {meta && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm mt-4">
              <div className="text-muted-foreground">
                Menampilkan{" "}
                <span className="font-semibold">
                  {(meta.page - 1) * meta.pageSize + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold">
                  {Math.min(meta.page * meta.pageSize, meta.total)}
                </span>{" "}
                dari <span className="font-semibold">{meta.total}</span> kota
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage(meta.page - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-muted-foreground">
                  Halaman <span className="font-semibold">{meta.page}</span> /{" "}
                  {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage(meta.page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog Add / Edit */}
      <CityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        provinces={provinces}
      />

      {/* Confirm Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kota?</AlertDialogTitle>
            <AlertDialogDescription>
              Kota <span className="font-semibold">{deleteTarget?.name}</span>{" "}
              akan dihapus permanen dan tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Ya, hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
