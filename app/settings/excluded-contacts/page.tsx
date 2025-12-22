"use client";

import useSWR from "swr";
import { useState } from "react";
import { Plus, Search, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExcludedContactTable } from "@/components/settings/excluded-contacts/excluded-contacts-table";
import { ExcludedContactModal } from "@/components/settings/excluded-contacts/excluded-contacts-modal";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

export default function ExcludedContactsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, mutate } = useSWR(
    `/api/settings/wa-excluded-contacts?q=${encodeURIComponent(q)}`,
    fetcher
  );

  return (
    <DashboardLayout title="Pengecualian Kontak">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Pengecualian Kontak WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kontak di sini tidak akan dibuat sebagai lead saat mengirim pesan
              WhatsApp
            </p>
          </div>

          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kontak
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama / nomor / catatan"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </Card>

        {/* Table */}
        {isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-full" />
          </Card>
        ) : data?.data?.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <UserX className="mx-auto mb-3 h-8 w-8" />
            <p className="font-medium">Belum ada kontak pengecualian</p>
            <p className="text-sm mt-1">
              Tambahkan nomor teman, rekan kerja, atau keluarga agar tidak masuk
              sebagai lead
            </p>
          </Card>
        ) : (
          <ExcludedContactTable
            items={data.data}
            onEdit={(row) => {
              setEditing(row);
              setOpen(true);
            }}
            onChanged={mutate}
          />
        )}

        <ExcludedContactModal
          open={open}
          onOpenChange={setOpen}
          initialData={editing}
          onSaved={() => {
            mutate();
            setOpen(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
