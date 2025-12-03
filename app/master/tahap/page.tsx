// app/master/tahap/page.tsx
"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { mutate } from "swr";
import {
  LeadStageList,
  LeadStage,
  LEAD_STAGES_KEY,
} from "@/components/master/lead-stage/lead-stage-list";

type FormState = {
  name: string;
  code: string;
  order: number | string;
  isActive: boolean;
};

const defaultForm: FormState = {
  name: "",
  code: "",
  order: 0,
  isActive: true,
};

export default function LeadStageMasterPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<LeadStage | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const [deleteTarget, setDeleteTarget] = useState<LeadStage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (stage: LeadStage) => {
    setEditing(stage);
    setForm({
      name: stage.name || "",
      code: stage.code || "",
      order: stage.order ?? 0,
      isActive: stage.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleChange = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Nama dan kode tahap wajib diisi.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: form.name.trim(),
        code: String(form.code).trim().toUpperCase(),
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };

      const url = editing
        ? `/api/lead-stages/${editing.id}`
        : "/api/lead-stages";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan tahap");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Tahap berhasil diperbarui."
          : "Tahap baru berhasil ditambahkan.",
      });

      setIsDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);

      // refresh semua list yang key-nya diawali LEAD_STAGES_KEY
      await mutate(
        (key: any) => typeof key === "string" && key.startsWith(LEAD_STAGES_KEY)
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan saat menyimpan tahap.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/lead-stages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menonaktifkan tahap");
      }

      toast({
        title: "Berhasil",
        description: `Tahap "${deleteTarget.name}" dinonaktifkan.`,
      });

      setDeleteTarget(null);
      await mutate(
        (key: any) => typeof key === "string" && key.startsWith(LEAD_STAGES_KEY)
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menonaktifkan tahap.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Master Tahap Lead" role="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar Tahap</h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola tahapan lead seperti Baru, FU 1, FU 2, Closing, dan
              lain-lain.
            </p>
          </div>
          <Button
            className="gradient-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tahap
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari nama atau kode tahap..."
            className="pl-10 h-12 border-gray-300 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List Tahap (tabel + pagination) */}
        <LeadStageList
          searchQuery={search}
          onEdit={openEdit}
          onDelete={(s) => setDeleteTarget(s)}
        />

        {/* Dialog Tambah/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Tahap Lead" : "Tambah Tahap Lead"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nama Tahap</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Misal: Baru, FU 1, FU 2, Closing"
                />
              </div>

              <div className="space-y-2">
                <Label>Kode Tahap</Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="Misal: NEW, FU1, FU2, CLS"
                />
                <p className="text-xs text-gray-500">
                  Kode digunakan untuk laporan & filtering (usahakan konsisten).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => handleChange("order", e.target.value ?? 0)}
                />
                <p className="text-xs text-gray-500">
                  Urutan menentukan posisi tahap di dropdown dan pipeline.
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="flex items-center gap-1">
                    Status Aktif
                  </Label>
                  <p className="text-xs text-gray-500">
                    Nonaktifkan jika tahap sudah tidak digunakan lagi.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => handleChange("isActive", v)}
                  />
                  <span className="text-sm text-gray-700">
                    {form.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  className="gradient-primary text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editing
                    ? "Simpan Perubahan"
                    : "Tambah Tahap"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Konfirmasi Nonaktifkan */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nonaktifkan tahap?</AlertDialogTitle>
              <AlertDialogDescription>
                Tahap{" "}
                <span className="font-semibold">{deleteTarget?.name}</span> akan
                dinonaktifkan dan tidak bisa dipilih lagi di lead baru, tetapi
                data lama tetap aman
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Memproses..." : "Ya, nonaktifkan"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
