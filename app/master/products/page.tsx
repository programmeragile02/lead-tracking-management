"use client";

import { useState, useRef, ChangeEvent } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ProductList,
  Product,
  PRODUCTS_KEY,
} from "@/components/master/product-list";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { mutate } from "swr";

type FormState = {
  category: string;
  name: string;
  description: string;
  photo: string;
  isAvailable: boolean;
};

const defaultForm: FormState = {
  category: "",
  name: "",
  description: "",
  photo: "",
  isAvailable: true,
};

export default function ProductMasterPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      category: product.category || "",
      name: product.name || "",
      description: product.description || "",
      photo: product.photo || "",
      isAvailable: product.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleChange = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.category || !form.name) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Kategori dan nama produk wajib diisi.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        category: form.category,
        name: form.name,
        description: form.description || null,
        photo: form.photo || null,
        isAvailable: form.isAvailable,
      };

      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan produk");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan.",
      });

      setIsDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      await mutate(PRODUCTS_KEY);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan saat menyimpan produk.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menghapus produk");
      }

      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus.",
      });

      setDeleteTarget(null);
      await mutate(PRODUCTS_KEY);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan saat menghapus produk.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Silakan upload file gambar (JPG, PNG, dll).",
      });
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads/product-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal mengupload gambar");
      }

      handleChange("photo", json.url);

      toast({
        title: "Berhasil",
        description: "Foto produk berhasil diupload.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal upload",
        description: err?.message || "Terjadi kesalahan saat upload gambar.",
      });
    } finally {
      setUploadingPhoto(false);
      // reset input supaya bisa upload file yang sama lagi jika perlu
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  return (
    <DashboardLayout title="Master Produk" role="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar Produk</h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola semua produk yang tersedia untuk lead
            </p>
          </div>
          <Button
            className="gradient-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </div>

        {/* Search Bar (belum di-wire ke API, nanti bisa dipakai buat query ?q=) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari nama produk atau kategori..."
            className="pl-10 h-12 border-gray-300 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product List */}
        <ProductList onEdit={openEdit} onDelete={(p) => setDeleteTarget(p)} />

        {/* Dialog Tambah/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Produk" : "Tambah Produk"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Kategori Produk</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jasa">Jasa</SelectItem>
                    <SelectItem value="Layanan">Layanan</SelectItem>
                    <SelectItem value="Produk">Produk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Misal: Paket Website Development"
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Produk</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Tuliskan deskripsi singkat produk..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto Produk</Label>

                {/* input file disembunyikan, kita trigger manual */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {form.photo ? (
                  <div className="flex flex-col md:flex-col gap-4 items-start">
                    <div className="relative w-full md:w-40 h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* preview foto */}
                      {/* kalau kamu pakai next/image */}
                      {/* @ts-ignore */}
                      <img
                        src={form.photo}
                        alt={form.name || "Foto produk"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600">
                        Foto sudah terupload. Kamu bisa mengganti atau menghapus
                        foto ini.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? "Mengupload..." : "Ganti Foto"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleChange("photo", "")}
                          disabled={uploadingPhoto}
                        >
                          Hapus Foto
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full border border-dashed border-gray-300 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                      {/* bisa pakai icon dari lucide */}
                      <svg
                        className="w-7 h-7 text-primary"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v1.125C3 18.66 4.343 20 6 20h12c1.657 0 3-1.34 3-2.375V16.5M16.5 9 12 4.5 7.5 9M12 4.5V15"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {uploadingPhoto
                          ? "Mengupload foto..."
                          : "Upload foto produk"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Klik di sini untuk memilih file gambar. Format JPG/PNG,
                        ukuran maksimal 2MB.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadingPhoto}
                    >
                      Pilih File
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="flex items-center gap-1">
                    Status Ketersediaan
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isAvailable}
                    onCheckedChange={(v) => handleChange("isAvailable", v)}
                  />
                  <span className="text-sm text-gray-700">
                    {form.isAvailable ? "Tersedia" : "Tidak tersedia"}
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
                    : "Tambah Produk"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Konfirmasi Hapus */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
              <AlertDialogDescription>
                Produk{" "}
                <span className="font-semibold">{deleteTarget?.name}</span> akan
                dihapus tidak permanen dan dipindahkan ke sampah
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Menghapus..." : "Ya, hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
