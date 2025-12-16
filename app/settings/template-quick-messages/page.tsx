"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type GlobalTpl = {
  id: number;
  title: string;
  body: string;
  category: string | null;
  mediaUrl: string | null;
  tags: any | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function categoryLabel(c?: string | null) {
  return c?.trim() ? c : "Umum";
}

const PLACEHOLDER_DOC = [
  { key: "{lead_name}", desc: "Nama lead" },
  { key: "{lead_phone}", desc: "Nomor WhatsApp lead" },
  { key: "{product_name}", desc: "Nama produk yang diminati lead" },
  { key: "{company_name}", desc: "Nama perusahaan dari General Setting" },
  { key: "{sales_name}", desc: "Nama sales yang menangani lead" },
  { key: "{price_offering}", desc: "Harga penawaran" },
  { key: "{price_negotiation}", desc: "Harga nego" },
  { key: "{price_closing}", desc: "Harga closing" },
];

export default function WhatsAppGlobalTemplatesSettingPage() {
  const { toast } = useToast();

  const [loadingGate, setLoadingGate] = useState(true); // biar mirip pola kamu
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const listUrl = useMemo(() => {
    const usp = new URLSearchParams();
    usp.set("mode", "global_admin");
    if (q.trim()) usp.set("q", q.trim());
    if (showInactive) usp.set("includeInactive", "1");
    return `/api/whatsapp/templates?${usp.toString()}`;
  }, [q, showInactive]);

  const { data, isLoading, mutate } = useSWR<{
    ok: boolean;
    data?: GlobalTpl[];
    error?: string;
  }>(listUrl, fetcher);

  const list = (data?.ok ? data.data : []) ?? [];

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<GlobalTpl | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // gate supaya “Memuat pengaturan…” style kamu muncul stabil
    if (isLoading) setLoadingGate(true);
    else setLoadingGate(false);
  }, [isLoading]);

  function openCreate() {
    setTitle("");
    setCategory("");
    setBody("");
    setIsActive(true);
    setCreateOpen(true);
  }

  function openEdit(t: GlobalTpl) {
    setSelected(t);
    setTitle(t.title || "");
    setCategory(t.category || "");
    setBody(t.body || "");
    setIsActive(Boolean(t.isActive));
    setEditOpen(true);
  }

  async function handleCreate() {
    try {
      if (!title.trim() || !body.trim()) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Judul & isi wajib diisi.",
        });
        return;
      }

      setSaving(true);

      const res = await fetch(`/api/whatsapp/templates?mode=global_admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category: category.trim() || null,
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error || json.message || "Gagal membuat template global."
        );
      }

      toast({
        title: "Berhasil",
        description: "Template global berhasil dibuat.",
      });

      setCreateOpen(false);
      await mutate();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan saat membuat template.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    try {
      if (!selected) return;
      if (!title.trim() || !body.trim()) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Judul & isi wajib diisi.",
        });
        return;
      }

      setSaving(true);

      const res = await fetch(
        `/api/whatsapp/templates/${selected.id}?mode=global_admin`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            category: category.trim() || null,
            isActive,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error || json.message || "Gagal menyimpan template global."
        );
      }

      toast({
        title: "Berhasil",
        description: "Template global berhasil diperbarui.",
      });

      setEditOpen(false);
      setSelected(null);
      await mutate();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan template.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: GlobalTpl) {
    const ok = confirm(`Hapus template global "${t.title}"?`);
    if (!ok) return;

    try {
      setSaving(true);
      const res = await fetch(
        `/api/whatsapp/templates/${t.id}?mode=global_admin`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error || json.message || "Gagal menghapus template."
        );
      }

      toast({
        title: "Berhasil",
        description: "Template global berhasil dihapus.",
      });
      await mutate();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menghapus template.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: GlobalTpl, next: boolean) {
    try {
      const res = await fetch(
        `/api/whatsapp/templates/${t.id}?mode=global_admin`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error || json.message || "Gagal mengubah status template."
        );
      }
      await mutate();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan saat mengubah status.",
      });
    }
  }

  return (
    <DashboardLayout title="WhatsApp Global Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Template WhatsApp Global</h2>
          <p className="text-sm text-muted-foreground">
            Template global dipakai oleh semua sales di fitur <b>Pesan Cepat</b>
            . Sales boleh “edit versi saya” (override) tanpa mengubah template
            global. Cocok untuk skrip standar, promo resmi, edukasi, atau format
            follow up.
          </p>
        </div>

        {/* 1 Card FULL */}
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                Manajemen Template Global
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tips: gunakan <b>Kategori</b> agar sales mudah mencari (Promo /
                Edukasi / Follow Up / Closing / Umum).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => mutate()}
                disabled={saving}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openCreate} disabled={saving}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Template
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loadingGate ? (
              <div className="text-sm text-muted-foreground">
                Memuat pengaturan...
              </div>
            ) : (
              <>
                {/* Filter/Search */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 md:max-w-md">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Cari template… (judul / isi / kategori)"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showInactive}
                        onCheckedChange={setShowInactive}
                      />
                      <span className="text-sm text-muted-foreground">
                        Tampilkan nonaktif
                      </span>
                    </div>
                  </div>
                </div>

                {/* List */}
                {list.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Belum ada template global. Klik <b>Tambah Template</b> untuk
                    membuat.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.map((t) => (
                      <div key={t.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{t.title}</p>

                              <Badge variant="outline" className="text-[11px]">
                                {categoryLabel(t.category)}
                              </Badge>

                              <Badge
                                className={[
                                  "text-[11px]",
                                  t.isActive
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-200 text-slate-900",
                                ].join(" ")}
                              >
                                {t.isActive ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                              {t.body}
                            </p>

                            <p className="mt-2 text-xs text-muted-foreground">
                              ID: <span className="font-mono">{t.id}</span> •
                              Update:{" "}
                              <span className="font-mono">
                                {new Date(t.updatedAt).toLocaleString("id-ID")}
                              </span>
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <Switch
                                checked={t.isActive}
                                onCheckedChange={(v) => toggleActive(t, v)}
                              />
                              <span className="text-sm text-muted-foreground">
                                {t.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(t)}
                              disabled={saving}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(t)}
                              disabled={saving}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Placeholder */}
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Placeholder yang bisa digunakan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Placeholder ini akan diganti otomatis saat sales menekan{" "}
                      <b>Pakai</b> di Pesan Cepat. Formatnya pakai{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        {"{...}"}
                      </code>
                      .
                    </p>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {PLACEHOLDER_DOC.map((p) => (
                      <div key={p.key} className="flex items-start gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {p.key}
                        </code>
                        <p className="text-xs text-muted-foreground">
                          {p.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Contoh template singkat:
                    </p>
                    <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-xs border">
                      {`Halo kak {lead_name}, saya {sales_name} dari {company_name}.
Kakak tertarik produk {product_name} ya? Untuk penawaran awalnya {price_offering}.`}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* CREATE DIALOG */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[760px]">
            <DialogHeader>
              <DialogTitle>Tambah Template Global</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Judul</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Promo Akhir Bulan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kategori (opsional)
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Promo / Edukasi / Follow Up / Closing / Umum"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Isi Pesan</label>
                <Textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tulis template… bisa pakai {lead_name}, {company_name}, dst."
                />
                <p className="text-xs text-muted-foreground">
                  Gunakan placeholder format{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    {"{lead_name}"}
                  </code>{" "}
                  (bukan double-curly).
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status Template</p>
                  <p className="text-xs text-muted-foreground">
                    Jika nonaktif, template tidak muncul di Pesan Cepat sales.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm text-muted-foreground">
                    {isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !title.trim() || !body.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT DIALOG */}
        <Dialog
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setSelected(null);
          }}
        >
          <DialogContent className="sm:max-w-[760px]">
            <DialogHeader>
              <DialogTitle>Edit Template Global</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Judul</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kategori (opsional)
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Isi Pesan</label>
                <Textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status Template</p>
                  <p className="text-xs text-muted-foreground">
                    Jika nonaktif, template tidak muncul di Pesan Cepat sales.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm text-muted-foreground">
                    {isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setSelected(null);
                }}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={saving || !title.trim() || !body.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}