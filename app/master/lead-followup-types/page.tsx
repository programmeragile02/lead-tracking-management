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

  // nurturing
  isNurturingStep: boolean;
  nurturingOrder: string; // pakai string biar gampang di input
  autoDelayHours: string; // string -> nanti di-convert ke number
  autoOnLeadCreate: boolean;

  // template WA
  waTemplateTitle: string;
  waTemplateBody: string;
  waTemplateMedia: string;
};

const defaultForm: FormState = {
  name: "",
  code: "",
  description: "",
  isActive: true,

  isNurturingStep: false,
  nurturingOrder: "",
  autoDelayHours: "",
  autoOnLeadCreate: false,

  waTemplateTitle: "",
  waTemplateBody: "",
  waTemplateMedia: "",
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

      isNurturingStep: item.isNurturingStep ?? false,
      nurturingOrder:
        item.nurturingOrder !== null && item.nurturingOrder !== undefined
          ? String(item.nurturingOrder)
          : "",
      autoDelayHours:
        item.autoDelayHours !== null && item.autoDelayHours !== undefined
          ? String(item.autoDelayHours)
          : "",
      autoOnLeadCreate: item.autoOnLeadCreate ?? false,

      waTemplateTitle: item.waTemplateTitle || "",
      waTemplateBody: item.waTemplateBody || "",
      waTemplateMedia: item.waTemplateMedia || "",
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

    // convert string -> number/null
    const nurturingOrderNumber =
      form.nurturingOrder.trim() === ""
        ? null
        : Number.parseInt(form.nurturingOrder.trim(), 10);

    const autoDelayHoursNumber =
      form.autoDelayHours.trim() === ""
        ? null
        : Number.parseInt(form.autoDelayHours.trim(), 10);

    if (
      form.isNurturingStep &&
      (Number.isNaN(nurturingOrderNumber) || nurturingOrderNumber! <= 0)
    ) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description:
          "Urutan nurturing wajib diisi dan harus lebih dari 0 jika diaktifkan.",
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

        isNurturingStep: form.isNurturingStep,
        nurturingOrder: form.isNurturingStep ? nurturingOrderNumber : null,
        autoDelayHours: form.isNurturingStep ? autoDelayHoursNumber : null,
        autoOnLeadCreate: form.isNurturingStep ? form.autoOnLeadCreate : false,

        waTemplateTitle: form.waTemplateTitle.trim() || null,
        waTemplateBody: form.waTemplateBody.trim() || null,
        waTemplateMedia: form.waTemplateMedia.trim() || null,
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
    <DashboardLayout title="Master Tindak Lanjut Lead" role="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Daftar Tindak Lanjut
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola jenis tindak lanjut seperti Follow Up 1, Follow Up 2, Kirim
              Proposal, Negosiasi, dan lain-lain.
            </p>
          </div>
          <Button
            className="gradient-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tindak Lanjut
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari nama atau kode tindak lanjut..."
            className="pl-10 h-12 border-gray-300 focus:border-primary"
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
                  placeholder="Misal: Follow Up 1, Follow Up 2, Kirim Proposal"
                />
              </div>

              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="Misal: FU1, FU2, KIRIM_PROPOSAL"
                />
                <p className="text-xs text-gray-500">
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

              {/* Pengaturan Nurturing Otomatis */}
              <div className="mt-4 rounded-xl border bg-muted/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label className="flex items-center gap-1">
                      Nurturing Otomatis
                    </Label>
                    <p className="text-xs mt-1 text-gray-500">
                      Aktifkan jika tindak lanjut ini termasuk dalam urutan
                      nurturing otomatis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isNurturingStep}
                      onCheckedChange={(v) =>
                        handleChange("isNurturingStep", v)
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {form.isNurturingStep ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                {form.isNurturingStep && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <Label>Urutan Nurturing</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.nurturingOrder}
                        onChange={(e) =>
                          handleChange("nurturingOrder", e.target.value)
                        }
                      />
                      <p className="text-xs text-gray-500">
                        1 = Follow Up 1 (pertama), 2 = Follow Up2, dst
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label>Delay Otomatis (Jam)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.autoDelayHours}
                        onChange={(e) =>
                          handleChange("autoDelayHours", e.target.value)
                        }
                        placeholder="24 = 24 jam setelah step sebelumnya"
                      />
                      <p className="text-xs text-gray-500">
                        Contoh: 24 jam setelah Follow Up 1 untuk Follow Up 2
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label>Kirim Saat Lead Baru Masuk</Label>
                      <div className="flex flex-col items-start gap-2 mt-1">
                        <Switch
                          checked={form.autoOnLeadCreate}
                          onCheckedChange={(v) =>
                            handleChange("autoOnLeadCreate", v)
                          }
                        />
                        <p className="text-xs text-gray-600">
                          Biasanya hanya untuk Follow Up 1
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Pesan WhatsApp */}
              <div className="mt-4 rounded-xl border bg-muted/40 p-4 space-y-3">
                <div className="space-y-1">
                  <Label>Judul Template (Opsional)</Label>
                  <Input
                    value={form.waTemplateTitle}
                    onChange={(e) =>
                      handleChange("waTemplateTitle", e.target.value)
                    }
                    placeholder="Misal: Sambutan Lead Baru"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Isi Pesan WhatsApp</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    rows={6}
                    value={form.waTemplateBody}
                    onChange={(e) =>
                      handleChange("waTemplateBody", e.target.value)
                    }
                    placeholder={`Hai {{nama_lead}}, saya {{nama_sales}} dari {{brand}} 👋

Terima kasih sudah tertarik dengan {{produk}}.
Saat ini kendala utama yang paling mengganggu apa, Kak?`}
                  />
                  <p className="text-xs text-gray-500">
                    Kamu bisa gunakan placeholder seperti{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      {"{{nama_lead}}"}
                    </code>
                    ,{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      {"{{nama_sales}}"}
                    </code>
                    ,{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      {"{{produk}}"}
                    </code>{" "}
                    yang nanti akan diganti otomatis saat pengiriman.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>URL Media (Opsional)</Label>
                  <Input
                    value={form.waTemplateMedia}
                    onChange={(e) =>
                      handleChange("waTemplateMedia", e.target.value)
                    }
                    placeholder="Link brosur / gambar jika ada"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="flex items-center gap-1">
                    Status Aktif
                  </Label>
                  <p className="text-xs text-gray-500">
                    Nonaktifkan jika tindak lanjut sudah tidak digunakan.
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
