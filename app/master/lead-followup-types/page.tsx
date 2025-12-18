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
  FollowUpTypeList,
  FollowUpType,
  LEAD_FOLLOWUP_TYPES_KEY,
} from "@/components/master/lead-followup-type/lead-followup-type-list";

type FormState = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
};

const defaultForm: FormState = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

export default function LeadFollowUpTypeMasterPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<FollowUpType | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const [deleteTarget, setDeleteTarget] = useState<FollowUpType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (item: FollowUpType) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleChange = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Nama tindak lanjut wajib diisi.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: form.name.trim(),
        code: String(form.code || "")
          .trim()
          .toUpperCase(),
        description: form.description.trim() || null,
        isActive: form.isActive,
      };

      const url = editing
        ? `/api/lead-followup-types/${editing.id}`
        : "/api/lead-followup-types";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan tindak lanjut");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Tindak lanjut berhasil diperbarui."
          : "Tindak lanjut baru berhasil ditambahkan.",
      });

      setIsDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);

      await mutate(
        (key: any) =>
          typeof key === "string" && key.startsWith(LEAD_FOLLOWUP_TYPES_KEY)
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan tindak lanjut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/lead-followup-types/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menonaktifkan tindak lanjut");
      }

      toast({
        title: "Berhasil",
        description: `Tindak lanjut "${deleteTarget.name}" dinonaktifkan.`,
      });

      setDeleteTarget(null);
      await mutate(
        (key: any) =>
          typeof key === "string" && key.startsWith(LEAD_FOLLOWUP_TYPES_KEY)
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menonaktifkan tindak lanjut.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Master Tindak Lanjut">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Master Tindak Lanjut
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola jenis tindak lanjut seperti Follow Up 1, Follow Up 2, Follow Up 3, dan seterusnya
            </p>
          </div>
          <Button
            className="bg-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tindak Lanjut
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kode tindak lanjut..."
            className="pl-10 h-12 border-muted-foreground focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <FollowUpTypeList
          searchQuery={search}
          onEdit={openEdit}
          onDelete={(s) => setDeleteTarget(s)}
        />

        {/* Dialog Tambah/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Tindak Lanjut" : "Tambah Tindak Lanjut"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nama Tindak Lanjut</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Misal: Follow Up 1, Follow Up 2"
                />
              </div>

              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="Misal: FU1, FU2"
                />
                <p className="text-xs text-muted-foreground">
                  Kode digunakan untuk laporan & filtering (otomatis
                  di-uppercase).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Catatan internal (opsional)"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="flex items-center gap-1">
                    Status Aktif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Nonaktifkan jika tindak lanjut sudah tidak digunakan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => handleChange("isActive", v)}
                  />
                  <span className="text-sm text-foreground">
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
                  className="bg-primary text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editing
                    ? "Simpan Perubahan"
                    : "Tambah Tindak Lanjut"}
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
              <AlertDialogTitle>Nonaktifkan tindak lanjut?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindak lanjut{" "}
                <span className="font-semibold">{deleteTarget?.name}</span> akan
                dinonaktifkan dan tidak bisa dipilih lagi di lead baru, tetapi
                data lama tetap aman.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-primary hover:bg-primary/50 text-white"
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
