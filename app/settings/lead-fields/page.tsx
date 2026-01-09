"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Plus,
  Search,
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

const API_KEY = "/api/lead-custom-fields";

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
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  ok: boolean;
  data: LeadCustomFieldDef[];
};

const fetcher = (url: string): Promise<ApiResponse> =>
  fetch(url).then((res) => res.json());

type OptionForm = {
  id?: number;
  label: string;
  value: string;
};

type FieldFormState = {
  label: string;
  key: string;
  type: LeadFieldType | "";
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  isActive: boolean;
  options: OptionForm[];
};

const defaultFieldForm: FieldFormState = {
  label: "",
  key: "",
  type: "",
  placeholder: "",
  helpText: "",
  isRequired: false,
  isActive: true,
  options: [],
};

/* ====== Sortable item untuk daftar field di sisi kiri ====== */

function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: LeadCustomFieldDef;
  onEdit: (f: LeadCustomFieldDef) => void;
  onDelete: (f: LeadCustomFieldDef) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const typeLabel: Record<LeadFieldType, string> = {
    TEXT: "Text",
    TEXTAREA: "Textarea",
    NUMBER: "Number",
    DATE: "Date",
    SINGLE_SELECT: "Dropdown",
    MULTI_SELECT: "Multi Choice",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border rounded-xl bg-secondary px-4 py-3 flex items-start gap-3 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-1 p-1 rounded hover:bg-card cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {field.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Key: <span className="font-mono">{field.key}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {typeLabel[field.type]}
            </Badge>
            {field.isRequired && (
              <Badge className="bg-red-500/10 text-red-700 border-red-500/30 text-xs">
                Wajib
              </Badge>
            )}
            {field.isActive ? (
              <Badge className="bg-emerald-500 text-white text-xs">Aktif</Badge>
            ) : (
              <Badge className="bg-gray-400 text-white text-xs">Nonaktif</Badge>
            )}
          </div>
        </div>
        {field.helpText && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {field.helpText}
          </p>
        )}
        {(field.type === "SINGLE_SELECT" || field.type === "MULTI_SELECT") &&
          field.options.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Opsi: {field.options.map((o) => o.label).join(", ")}
            </p>
          )}
      </div>

      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground hover:bg-black/10"
          onClick={() => onEdit(field)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/50"
          onClick={() => onDelete(field)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ====== Komponen kecil untuk preview field dinamis di sisi kanan ====== */

function PreviewDynamicField({ field }: { field: LeadCustomFieldDef }) {
  const isRequired = field.isRequired;
  const requiredMark = isRequired ? (
    <span className="text-primary ml-0.5">*</span>
  ) : null;

  const labelCls = "text-sm font-medium text-foreground flex items-center gap-1";
  const helpText = field.helpText ? (
    <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
  ) : null;

  const placeholder =
    field.placeholder || `Isi ${field.label.toLowerCase()} di sini...`;

  if (!field.isActive) {
    // di preview, field nonaktif bisa ditampilkan redup (opsional)
    return (
      <div className="space-y-1 opacity-50">
        <Label className={labelCls}>
          {field.label}
          {requiredMark}
          <Badge
            variant="outline"
            className="text-[10px] border-dashed border-gray-300 ml-1"
          >
            Nonaktif
          </Badge>
        </Label>
        <Input disabled placeholder={placeholder} />
        {helpText}
      </div>
    );
  }

  switch (field.type) {
    case "TEXT":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <Input disabled placeholder={placeholder} />
          {helpText}
        </div>
      );
    case "TEXTAREA":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <Textarea disabled rows={3} placeholder={placeholder} />
          {helpText}
        </div>
      );
    case "NUMBER":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <Input disabled type="number" placeholder={placeholder} />
          {helpText}
        </div>
      );
    case "DATE":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <Input disabled type="date" />
          {helpText}
        </div>
      );
    case "SINGLE_SELECT":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue
                placeholder={field.placeholder || "Pilih salah satu opsi..."}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options.length === 0 ? (
                <SelectItem value="dummy" disabled>
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
    case "MULTI_SELECT":
      return (
        <div className="space-y-1">
          <Label className={labelCls}>
            {field.label}
            {requiredMark}
          </Label>
          <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50/60">
            {field.options.length === 0 ? (
              <p className="text-xs text-gray-400">
                (Belum ada opsi multi choice)
              </p>
            ) : (
              field.options.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <Checkbox disabled />
                  {o.label}
                </label>
              ))
            )}
          </div>
          {helpText}
        </div>
      );
    default:
      return null;
  }
}

/* ====== Halaman Utama: Konfigurasi Field Lead + Preview ====== */

export default function LeadFieldSettingsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<ApiResponse>(API_KEY, fetcher);

  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadCustomFieldDef | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadCustomFieldDef | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const filteredFields = useMemo(() => {
    const items = data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
    );
  }, [data, search]);

  const [localOrder, setLocalOrder] = useState<number[]>([]);

  useEffect(() => {
    if (filteredFields.length > 0) {
      setLocalOrder(filteredFields.map((f) => f.id));
    } else {
      setLocalOrder([]);
    }
  }, [filteredFields.length]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOrder((prev) => {
      const oldIndex = prev.indexOf(Number(active.id));
      const newIndex = prev.indexOf(Number(over.id));
      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // kirim ke API reorder
      fetch("/api/lead-custom-fields/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newOrder }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (!json.ok) {
            throw new Error(json.message || "Gagal mengurutkan field");
          }
          mutate(API_KEY);
        })
        .catch((err) => {
          console.error(err);
          toast({
            variant: "destructive",
            title: "Gagal",
            description:
              err?.message || "Terjadi kesalahan saat mengurutkan field.",
          });
        });

      return newOrder;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFieldForm(defaultFieldForm);
    setIsDialogOpen(true);
  };

  const openEdit = (field: LeadCustomFieldDef) => {
    setEditing(field);
    setFieldForm({
      label: field.label,
      key: field.key,
      type: field.type,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      isRequired: field.isRequired,
      isActive: field.isActive,
      options: (field.options || []).map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
      })),
    });
    setIsDialogOpen(true);
  };

  const handleFieldChange = <K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K]
  ) => {
    setFieldForm((prev) => ({ ...prev, [key]: value }));
  };

  const addOption = () => {
    setFieldForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          label: "",
          value: "",
        },
      ],
    }));
  };

  const updateOption = (index: number, partial: Partial<OptionForm>) => {
    setFieldForm((prev) => {
      const next = [...prev.options];
      next[index] = { ...next[index], ...partial };
      return { ...prev, options: next };
    });
  };

  const removeOption = (index: number) => {
    setFieldForm((prev) => {
      const next = [...prev.options];
      next.splice(index, 1);
      return { ...prev, options: next };
    });
  };

  const handleSubmit = async () => {
    if (!fieldForm.label || !fieldForm.type) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Label dan tipe field wajib diisi.",
      });
      return;
    }

    if (
      (fieldForm.type === "SINGLE_SELECT" ||
        fieldForm.type === "MULTI_SELECT") &&
      fieldForm.options.length === 0
    ) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description:
          "Untuk tipe dropdown / multi choice, minimal satu opsi harus diisi.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        label: fieldForm.label.trim(),
        key: fieldForm.key.trim(),
        type: fieldForm.type,
        placeholder: fieldForm.placeholder || null,
        helpText: fieldForm.helpText || null,
        isRequired: fieldForm.isRequired,
        isActive: fieldForm.isActive,
      };

      if (
        fieldForm.type === "SINGLE_SELECT" ||
        fieldForm.type === "MULTI_SELECT"
      ) {
        payload.options = fieldForm.options.map((opt) => ({
          label: opt.label.trim(),
          value: opt.value.trim(),
        }));
      } else {
        payload.options = [];
      }

      const url = editing
        ? `/api/lead-custom-fields/${editing.id}`
        : "/api/lead-custom-fields";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan konfigurasi field");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Field lead berhasil diperbarui."
          : "Field lead baru berhasil ditambahkan.",
      });

      setIsDialogOpen(false);
      setEditing(null);
      setFieldForm(defaultFieldForm);
      await mutate(API_KEY);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan konfigurasi field.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);

      const res = await fetch(`/api/lead-custom-fields/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menonaktifkan field");
      }

      toast({
        title: "Berhasil",
        description: `Field "${deleteTarget.label}" dinonaktifkan.`,
      });

      setDeleteTarget(null);
      await mutate(API_KEY);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menonaktifkan field.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const orderedFields =
    filteredFields.length && localOrder.length
      ? [...filteredFields].sort(
          (a, b) => localOrder.indexOf(a.id) - localOrder.indexOf(b.id)
        )
      : filteredFields;

  return (
    <DashboardLayout title="Konfigurasi Data Lead">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Konfigurasi Field Lead
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Atur field dinamis untuk form lead. Di sebelah kanan, kamu bisa
              melihat preview tampilan form yang akan dipakai sales.
            </p>
          </div>
          <Button
            className="bg-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Field
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan label atau key field..."
            className="pl-10 h-12 border-border focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 2 kolom: kiri konfigurasi, kanan preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-start">
          {/* Kiri: daftar field + drag drop */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daftar Field Dinamis</CardTitle>
              <CardDescription className="text-xs">
                Gunakan drag & drop untuk mengatur urutan tampil di form lead.
                Klik edit untuk mengubah detail field.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-gray-500">
                  Memuat konfigurasi field...
                </p>
              ) : orderedFields.length === 0 ? (
                <div className="border border-dashed rounded-xl p-6 text-center text-gray-500 text-sm">
                  Belum ada field dinamis. Tambahkan field baru terlebih dulu.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedFields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {orderedFields.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={openEdit}
                          onDelete={(f) => setDeleteTarget(f)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Kanan: Preview Form Lead */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview Form Lead</CardTitle>
              <CardDescription className="text-xs">
                Tampilan kira-kira form yang akan dipakai untuk tambah / edit
                lead. Field paten selalu muncul, field dinamis mengikuti urutan
                di konfigurasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Field Paten */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Informasi Utama (Field Paten)
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    Tidak bisa diubah dari sini
                  </Badge>
                </div>

                {/* Nama & No HP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Nama Lead<span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      disabled
                      placeholder="Misal: Bapak Andi, Ibu Sari..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      No. HP
                    </Label>
                    <Input disabled placeholder="08xxxxxxxxxx (opsional)" />
                  </div>
                </div>

                {/* Alamat */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Alamat
                  </Label>
                  <Textarea
                    disabled
                    rows={2}
                    placeholder="Alamat lengkap lead..."
                  />
                </div>

                {/* Foto */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Foto Lead (opsional)
                  </Label>
                  <div className="border border-dashed border-border rounded-xl p-3 flex items-center gap-3 bg-muted-foreground/60">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Upload foto lead
                      </p>
                      <p className="text-xs text-foreground">
                        Preview saja. Upload asli dilakukan di halaman tambah
                        lead.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      Pilih File
                    </Button>
                  </div>
                </div>

                {/* Harga */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Harga Penawaran / Negosiasi / Closing
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      disabled
                      placeholder="Harga penawaran"
                      className="text-sm"
                    />
                    <Input
                      disabled
                      placeholder="Harga negosiasi"
                      className="text-sm"
                    />
                    <Input
                      disabled
                      placeholder="Harga closing"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Field Dinamis */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Field Dinamis (Konfigurasi)
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    Urutan mengikuti setting di kiri
                  </Badge>
                </div>

                {orderedFields.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    Belum ada field dinamis. Tambah field di sisi kiri untuk
                    melihat preview di sini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orderedFields.map((field) => (
                      <PreviewDynamicField key={field.id} field={field} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog Tambah/Edit Field */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Field Lead" : "Tambah Field Lead"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Label Field</Label>
                <Input
                  value={fieldForm.label}
                  onChange={(e) => handleFieldChange("label", e.target.value)}
                  placeholder="Misal: Sumber Lead, Minat Produk"
                />
              </div>

              <div className="space-y-2">
                <Label>Key (opsional)</Label>
                <Input
                  value={fieldForm.key}
                  onChange={(e) => handleFieldChange("key", e.target.value)}
                  placeholder="Jika dikosongkan akan dibuat otomatis dari label"
                />
                <p className="text-xs text-gray-500">
                  Digunakan di backend / integrasi. Gunakan huruf kecil dan
                  underscore.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipe Field</Label>
                <Select
                  value={fieldForm.type}
                  onValueChange={(v) =>
                    handleFieldChange("type", v as LeadFieldType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="TEXTAREA">Textarea</SelectItem>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="DATE">Date</SelectItem>
                    <SelectItem value="SINGLE_SELECT">
                      Dropdown (pilih satu)
                    </SelectItem>
                    <SelectItem value="MULTI_SELECT">
                      Multi Choice (pilih banyak)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Placeholder (opsional)</Label>
                  <Input
                    value={fieldForm.placeholder}
                    onChange={(e) =>
                      handleFieldChange("placeholder", e.target.value)
                    }
                    placeholder="Contoh: Pilih sumber lead..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wajib Diisi</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Jika aktif, field ini harus diisi saat tambah lead.
                    </span>
                    <Switch
                      checked={fieldForm.isRequired}
                      onCheckedChange={(v) =>
                        handleFieldChange("isRequired", v)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Help Text (opsional)</Label>
                <Textarea
                  value={fieldForm.helpText}
                  onChange={(e) =>
                    handleFieldChange("helpText", e.target.value)
                  }
                  placeholder="Info tambahan yang muncul di bawah field..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Status Aktif</Label>
                  <p className="text-xs text-gray-500">
                    Nonaktifkan jika field tidak ingin ditampilkan di form lead.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={fieldForm.isActive}
                    onCheckedChange={(v) => handleFieldChange("isActive", v)}
                  />
                  <span className="text-sm text-foreground">
                    {fieldForm.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              {(fieldForm.type === "SINGLE_SELECT" ||
                fieldForm.type === "MULTI_SELECT") && (
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      Opsi{" "}
                      {fieldForm.type === "SINGLE_SELECT"
                        ? "Dropdown"
                        : "Multi Choice"}
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addOption}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Opsi
                    </Button>
                  </div>
                  {fieldForm.options.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Belum ada opsi. Tambahkan minimal satu opsi.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {fieldForm.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-2"
                        >
                          <div className="flex flex-col gap-1 flex-1">
                            <Input
                              value={opt.label}
                              onChange={(e) =>
                                updateOption(idx, { label: e.target.value })
                              }
                              placeholder={`Opsi ${idx + 1} - label`}
                            />
                            <Input
                              value={opt.value}
                              onChange={(e) =>
                                updateOption(idx, { value: e.target.value })
                              }
                              placeholder={`Opsi ${
                                idx + 1
                              } - value (opsional, default akan dibuat dari label)`}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-500"
                              disabled={idx === 0}
                              onClick={() => {
                                if (idx === 0) return;
                                const opts = [...fieldForm.options];
                                const tmp = opts[idx - 1];
                                opts[idx - 1] = opts[idx];
                                opts[idx] = tmp;
                                setFieldForm((prev) => ({
                                  ...prev,
                                  options: opts,
                                }));
                              }}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-500"
                              disabled={idx === fieldForm.options.length - 1}
                              onClick={() => {
                                if (idx === fieldForm.options.length - 1)
                                  return;
                                const opts = [...fieldForm.options];
                                const tmp = opts[idx + 1];
                                opts[idx + 1] = opts[idx];
                                opts[idx] = tmp;
                                setFieldForm((prev) => ({
                                  ...prev,
                                  options: opts,
                                }));
                              }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => removeOption(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Urutan opsi di sini akan menentukan urutan di dropdown form
                    lead.
                  </p>
                </div>
              )}

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
                    : "Tambah Field"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Konfirmasi nonaktifkan field */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nonaktifkan field lead?</AlertDialogTitle>
              <AlertDialogDescription>
                Field{" "}
                <span className="font-semibold">{deleteTarget?.label}</span>{" "}
                akan dinonaktifkan dan tidak muncul lagi di form lead baru,
                tetapi data lama tetap aman.
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
