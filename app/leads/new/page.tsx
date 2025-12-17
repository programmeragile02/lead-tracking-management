"use client";

import { useState, useRef, ChangeEvent, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type FormState = {
  name: string;
  address: string;
  phone: string;
  photoUrl: string;
  priceOffering: string;
  priceNegotiation: string;
  priceClosing: string;
  productId: string; // dropdown produk
  sourceId: string; // dropdown sumber lead
};

const defaultForm: FormState = {
  name: "",
  address: "",
  phone: "",
  photoUrl: "",
  priceOffering: "",
  priceNegotiation: "",
  priceClosing: "",
  productId: "",
  sourceId: "",
};

// ==== Types field dinamis ====
type LeadFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT";

type LeadCustomFieldOption = {
  id: number;
  label: string;
  value: string;
  sortOrder: number;
};

type LeadCustomFieldDef = {
  id: number;
  key: string;
  label: string;
  type: LeadFieldType;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  options: LeadCustomFieldOption[];
};

type FieldApiResponse = {
  ok: boolean;
  data: LeadCustomFieldDef[];
};

const fieldFetcher = (url: string): Promise<FieldApiResponse> =>
  fetch(url).then((res) => res.json());

// ==== Types produk ====
type Product = {
  id: number;
  category: string;
  name: string;
  description?: string | null;
  photo?: string | null;
  isAvailable: boolean;
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

const productFetcher = (url: string): Promise<ProductApiResponse> =>
  fetch(url).then((res) => res.json());

// ==== Types Lead Source ====
type LeadSource = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

type LeadSourceApiResponse = {
  ok: boolean;
  data: LeadSource[];
};

const leadSourceFetcher = (url: string): Promise<LeadSourceApiResponse> =>
  fetch(url).then((res) => res.json());

type DynamicValueState = Record<number, string | string[]>;

export default function CreateLeadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // field dinamis
  const { data: fieldResp, isLoading: loadingFields } =
    useSWR<FieldApiResponse>("/api/lead-custom-fields", fieldFetcher);

  const dynamicFields: LeadCustomFieldDef[] = useMemo(() => {
    const raw = fieldResp?.data ?? [];
    return raw
      .filter((f) => f.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [fieldResp]);

  // produk
  const { data: productResp, isLoading: loadingProducts } =
    useSWR<ProductApiResponse>(
      "/api/products?page=1&pageSize=100",
      productFetcher
    );

  const products: Product[] = useMemo(() => {
    const raw = productResp?.data ?? [];
    return raw.filter((p) => p.isAvailable);
  }, [productResp]);

  // sumber lead
  const { data: leadSourceResp, isLoading: loadingSources } =
    useSWR<LeadSourceApiResponse>("/api/lead-sources", leadSourceFetcher);

  const leadSources: LeadSource[] = useMemo(
    () => leadSourceResp?.data ?? [],
    [leadSourceResp]
  );

  const [dynamicValues, setDynamicValues] = useState<DynamicValueState>({});

  const handleChange = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDynamicChange = (
    field: LeadCustomFieldDef,
    value: string | string[]
  ) => {
    setDynamicValues((prev) => ({
      ...prev,
      [field.id]: value,
    }));
  };

  const toggleMultiSelect = (
    field: LeadCustomFieldDef,
    optionValue: string
  ) => {
    setDynamicValues((prev) => {
      const current = prev[field.id];
      const arr = Array.isArray(current) ? current : [];
      if (arr.includes(optionValue)) {
        return {
          ...prev,
          [field.id]: arr.filter((v) => v !== optionValue),
        };
      }
      return {
        ...prev,
        [field.id]: [...arr, optionValue],
      };
    });
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

      // sesuaikan endpoint upload
      const res = await fetch("/api/uploads/lead-photo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal mengupload foto lead");
      }

      handleChange("photoUrl", json.url);

      toast({
        title: "Berhasil",
        description: "Foto lead berhasil diupload.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal upload",
        description: err?.message || "Terjadi kesalahan saat upload foto.",
      });
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    // validasi paten
    if (!form.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Nama lead wajib diisi.",
      });
      return;
    }

    if (!form.productId.trim()) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Produk wajib dipilih.",
      });
      return;
    }

    // validasi field dinamis wajib
    for (const field of dynamicFields) {
      if (!field.isRequired) continue;

      const val = dynamicValues[field.id];
      if (field.type === "MULTI_SELECT") {
        const arr = Array.isArray(val) ? val : [];
        if (arr.length === 0) {
          toast({
            variant: "destructive",
            title: "Validasi gagal",
            description: `Field "${field.label}" wajib diisi.`,
          });
          return;
        }
      } else {
        const s = typeof val === "string" ? val.trim() : "";
        if (!s) {
          toast({
            variant: "destructive",
            title: "Validasi gagal",
            description: `Field "${field.label}" wajib diisi.`,
          });
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const customValuesPayload: { fieldId: number; value: string }[] =
        dynamicFields.map((field) => {
          const raw = dynamicValues[field.id];

          if (field.type === "MULTI_SELECT") {
            const arr = Array.isArray(raw) ? raw : [];
            return {
              fieldId: field.id,
              value: JSON.stringify(arr),
            };
          }

          const s = typeof raw === "string" && raw.trim() ? raw.trim() : "";
          return {
            fieldId: field.id,
            value: s,
          };
        });

      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        photoUrl: form.photoUrl || null,
        priceOffering: form.priceOffering.trim() || null,
        priceNegotiation: form.priceNegotiation.trim() || null,
        priceClosing: form.priceClosing.trim() || null,
        productId: form.productId || null,
        sourceId: form.sourceId || null, //  kirim ke API
        customValues: customValuesPayload,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan lead baru");
      }

      toast({
        title: "Berhasil",
        description:
          "Lead baru berhasil dibuat. Tahap otomatis: Kontak Awal, status: Baru.",
      });

      router.push("/leads");
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan lead baru.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Tambah Lead Baru">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Tambah Lead Baru</h2>
          <p className="text-sm text-muted-foreground">
            Isi informasi dasar lead, pilih produk & sumber lead, serta field
            tambahan. Tahap &amp; status awal akan otomatis diatur (Kontak Awal
            &amp; Warm).
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary shadow-sm p-4 md:p-6 space-y-6">
          {/* === FIELD PATEN === */}
          {/* Nama & HP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Nama <span className="text-primary">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Misal: Bapak Andi, Ibu Sari..."
              />
            </div>
            <div className="space-y-2">
              <Label>
                No. HP<span className="text-primary">*</span>
              </Label>
              <Input
                value={form.phone}
                type="number"
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          {/* Produk & Sumber Lead (2 kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Produk */}
            <div className="space-y-2">
              <Label>
                Produk <span className="text-primary">*</span>
              </Label>
              <Select
                value={form.productId}
                onValueChange={(v) => handleChange("productId", v)}
                disabled={loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProducts
                        ? "Memuat daftar produk..."
                        : "Pilih produk yang ditawarkan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Belum ada produk tersedia
                    </SelectItem>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}{" "}
                        {p.category && (
                          <span className="text-xs text-gray-500">
                            ({p.category})
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Sumber Lead */}
            <div className="space-y-2">
              <Label>
                Sumber Lead <span className="text-primary">*</span>
              </Label>
              <Select
                value={form.sourceId}
                onValueChange={(v) => handleChange("sourceId", v)}
                disabled={loadingSources}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingSources
                        ? "Memuat sumber lead..."
                        : "Pilih sumber lead"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Belum ada sumber lead
                    </SelectItem>
                  ) : (
                    leadSources.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                        {s.code && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({s.code})
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-2">
            <Label>
              Alamat <span className="text-primary">*</span>
            </Label>
            <Textarea
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              placeholder="Alamat lengkap..."
            />
          </div>

          {/* Foto Lead */}
          <div className="space-y-2">
            <Label>Foto (opsional)</Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {form.photoUrl ? (
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative w-full md:w-40 h-40 rounded-xl overflow-hidden border border-border bg-secondary">
                  {/* @ts-ignore */}
                  <img
                    src={form.photoUrl}
                    alt={form.name || "Foto lead"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
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
                      className="text-primary hover:bg-red-50"
                      onClick={() => handleChange("photoUrl", "")}
                      disabled={uploadingPhoto}
                    >
                      Hapus Foto
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full border border-dashed border-muted-foreground rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
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
                  <p className="text-sm font-medium text-foreground">
                    {uploadingPhoto
                      ? "Mengupload foto..."
                      : "Upload foto lead (opsional)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
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

          {/* Harga */}
          <div className="space-y-2">
            <Label>Harga Penawaran / Negosiasi / Closing</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={form.priceOffering}
                onChange={(e) => handleChange("priceOffering", e.target.value)}
                placeholder="Harga penawaran"
              />
              <Input
                value={form.priceNegotiation}
                onChange={(e) =>
                  handleChange("priceNegotiation", e.target.value)
                }
                placeholder="Harga negosiasi"
              />
              <Input
                value={form.priceClosing}
                onChange={(e) => handleChange("priceClosing", e.target.value)}
                placeholder="Harga closing"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Angka saja, tanpa titik/koma. Misal: 15000000 untuk Rp 15.000.000
            </p>
          </div>

          {/* === FIELD DINAMIS === */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Informasi Tambahan
              </h3>
              {loadingFields && (
                <span className="text-xs text-muted-foreground">
                  Memuat konfigurasi field...
                </span>
              )}
            </div>

            {dynamicFields.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Belum ada field dinamis. Tambahkan di menu pengaturan
                &quot;Konfigurasi Data Lead&quot; jika diperlukan.
              </p>
            ) : (
              <div className="space-y-3">
                {dynamicFields.map((field) => {
                  const requiredMark = field.isRequired ? (
                    <span className="text-primary ml-0.5">*</span>
                  ) : null;

                  const labelCls =
                    "text-sm font-medium text-foreground flex items-center gap-1";

                  const helpText = field.helpText ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.helpText}
                    </p>
                  ) : null;

                  const placeholder =
                    field.placeholder ||
                    `Isi ${field.label.toLowerCase()} di sini...`;

                  const value = dynamicValues[field.id];

                  if (field.type === "TEXT") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <Input
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            handleDynamicChange(field, e.target.value)
                          }
                          placeholder={placeholder}
                        />
                        {helpText}
                      </div>
                    );
                  }

                  if (field.type === "TEXTAREA") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <Textarea
                          rows={3}
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            handleDynamicChange(field, e.target.value)
                          }
                          placeholder={placeholder}
                        />
                        {helpText}
                      </div>
                    );
                  }

                  if (field.type === "NUMBER") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <Input
                          type="number"
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            handleDynamicChange(field, e.target.value)
                          }
                          placeholder={placeholder}
                        />
                        {helpText}
                      </div>
                    );
                  }

                  if (field.type === "DATE") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <Input
                          type="date"
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            handleDynamicChange(field, e.target.value)
                          }
                        />
                        {helpText}
                      </div>
                    );
                  }

                  if (field.type === "SINGLE_SELECT") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <Select
                          value={typeof value === "string" ? value : ""}
                          onValueChange={(v) => handleDynamicChange(field, v)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                field.placeholder || "Pilih salah satu opsi..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.length === 0 ? (
                              <SelectItem value="__dummy" disabled>
                                (Belum ada opsi)
                              </SelectItem>
                            ) : (
                              field.options.map((o) => (
                                <SelectItem key={o.id} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {helpText}
                      </div>
                    );
                  }

                  if (field.type === "MULTI_SELECT") {
                    const arr = Array.isArray(value) ? value : [];
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className={labelCls}>
                          {field.label}
                          {requiredMark}
                        </Label>
                        <div className="flex flex-wrap gap-2 border border-border rounded-lg p-2 bg-muted-foreground">
                          {field.options.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              (Belum ada opsi multi choice)
                            </p>
                          ) : (
                            field.options.map((o) => (
                              <label
                                key={o.id}
                                className="flex items-center gap-2 text-xs text-foreground"
                              >
                                <Checkbox
                                  checked={arr.includes(o.value)}
                                  onCheckedChange={() =>
                                    toggleMultiSelect(field, o.value)
                                  }
                                />
                                {o.label}
                              </label>
                            ))
                          )}
                        </div>
                        {helpText}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/leads")}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="gradient-primary text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Lead"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
