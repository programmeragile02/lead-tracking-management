"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

/* =========================
 * TYPES
 * ========================= */
type PreviewRow = {
  rowNumber: number;
  createdAt: string | null;

  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;

  productName: string | null;
  productId: number | null;

  sourceId: number | null;
  stageId: number | null;
  statusId: number | null;
  subStatusId: number | null;

  priceOffering: string | null;
  priceNegotiation: string | null;
  priceClosing: string | null;
};

type PreviewResp = {
  ok: boolean;
  data?: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    invalidRows: number;
    preview: PreviewRow[];
    skipped?: Array<{ rowNumber: number; reason: string }>;
    errors: Array<{ rowNumber: number; messages: string[] }>;
  };
  error?: string;
};

type ImportMeta = {
  ok: boolean;
  data?: {
    products: Array<{ id: number; name: string }>;
    sources: Array<{ id: number; code: string; name: string }>;
    stages: Array<{ id: number; code: string; name: string; order: number }>;
    statuses: Array<{ id: number; code: string; name: string; order: number }>;
    subStatuses: Array<{
      id: number;
      code: string;
      name: string;
      status: { code: string; name: string };
    }>;
  };
  error?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* =========================
 * HELPERS
 * ========================= */
function fmtMoney(v: string | null) {
  if (!v) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCreatedAt(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================
 * COMPONENT
 * ========================= */
export function ImportLeadsDialog(props: { onImported?: () => void }) {
  const { onImported } = props;
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  const [stats, setStats] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
  } | null>(null);

  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [errors, setErrors] = useState<
    Array<{ rowNumber: number; messages: string[] }>
  >([]);
  const [skipped, setSkipped] = useState<
    Array<{ rowNumber: number; reason: string }>
  >([]);

  /* meta data */
  const {
    data: meta,
    isLoading: loadingMeta,
    mutate: refetchMeta,
  } = useSWR<ImportMeta>(open ? "/api/leads/import/meta" : null, fetcher);

  useEffect(() => {
    if (open) refetchMeta();
  }, [open, refetchMeta]);

  const canImport = useMemo(
    () => !!file && !!stats && stats.validRows > 0,
    [file, stats]
  );

  function resetState() {
    setFile(null);
    setStats(null);
    setPreview([]);
    setErrors([]);
    setSkipped([]);
    setLoadingPreview(false);
    setLoadingImport(false);
  }

  /* =========================
   * ACTIONS
   * ========================= */
  async function handlePreview() {
    if (!file) return;

    setLoadingPreview(true);
    setStats(null);
    setPreview([]);
    setErrors([]);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/leads/import/preview", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as PreviewResp;

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Preview gagal");
      }

      setStats({
        totalRows: json.data!.totalRows,
        validRows: json.data!.validRows,
        invalidRows: json.data!.invalidRows,
      });
      setPreview(json.data!.preview ?? []);
      setErrors(json.data!.errors ?? []);
      setSkipped(json.data!.skipped ?? []);

      toast({
        title: "Preview selesai",
        description: `Valid: ${json.data!.validRows}
      • Dilewati: ${json.data!.skippedRows}
      • Invalid: ${json.data!.invalidRows}`,
      });
    } catch (e: any) {
      toast({
        title: "Preview gagal",
        description: e?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    if (!file) return;

    setLoadingImport(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/leads/import/commit", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Import gagal");
      }

      toast({
        title: "Import selesai",
        description: `Sukses: ${json.data.inserted}
      • Dilewati: ${json.data.skipped}
      • Invalid: ${json.data.invalid}`,
      });

      onImported?.();
      setOpen(false);
      resetState();
    } catch (e: any) {
      toast({
        title: "Import gagal",
        description: e?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoadingImport(false);
    }
  }

  /* =========================
   * RENDER
   * ========================= */
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl px-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-base">
            Import Lead dari Excel
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          {/* ===== DROPZONE ===== */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition
              ${
                file
                  ? "border-primary bg-primary/10"
                  : "border-primary/60 bg-primary/5 hover:bg-primary/10"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />

              {!file ? (
                <>
                  <div className="text-sm font-medium">
                    Klik atau tarik file Excel ke sini
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Format .xlsx • gunakan template yang tersedia
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-primary">
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-xs underline text-primary">
                    Klik untuk ganti file
                  </div>
                </>
              )}
            </div>
          </div>
          <a
            href="/api/leads/import/template"
            className="flex items-center justify-center gap-2 text-xs hover:text-primary transition"
          >
            <Download className="h-4 w-4" />
            Unduh Template Excel
          </a>

          {/* ===== ACTIONS ===== */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-center">
            <Button
              variant="secondary"
              onClick={handlePreview}
              disabled={!file || loadingPreview || loadingImport}
            >
              1️⃣ Preview & Validasi
            </Button>

            <Button
              onClick={handleImport}
              disabled={!canImport || loadingPreview || loadingImport}
            >
              2️⃣ Import Sekarang
            </Button>
          </div>

          {!canImport && file && (
            <p className="text-xs text-muted-foreground">
              Lakukan preview terlebih dahulu untuk mengaktifkan import.
            </p>
          )}

          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <div className="font-medium text-foreground/90">
              Kolom template:
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium">Wajib:</span> Nama Lead
              </li>
              <li>
                <span className="font-medium">Opsional:</span> Tanggal lead
                masuk, No. Whatsapp (auto 62..), Alamat, Nama Produk
              </li>
              <li>
                <span className="font-medium">Kode (opsional):</span> Sumber
                Lead, Tahap, Status Utama, Sub Status
              </li>

              <li>
                <span className="font-medium">Harga (opsional):</span> Harga
                Penawaran, Harga Negosiasi, Harga Closing
              </li>
            </ul>
            <div className="italic">
              Tanggal masuk contoh:{" "}
              <span className="font-medium">2025-12-15</span> atau{" "}
              <span className="font-medium">2025-12-15 08:00</span> atau{" "}
              <span className="font-medium">2025/12/15</span>
            </div>
          </div>

          {/* master info */}
          {!stats && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                <div className="text-sm font-medium">
                  Data tersedia di sistem
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => refetchMeta()}
                >
                  Refresh
                </Button>
              </div>

              {loadingMeta ? (
                <div className="text-sm text-muted-foreground">
                  Memuat data master...
                </div>
              ) : !meta?.ok ? (
                <div className="text-sm text-destructive">
                  Gagal ambil data master: {meta?.error || "Unknown error"}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-sm font-medium mb-2">
                        Produk (isi: Nama Produk)
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto pr-1">
                        {meta.data!.products.length ? (
                          meta.data!.products.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-foreground">{p.name}</span>
                              <span className="opacity-70">#{p.id}</span>
                            </div>
                          ))
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-sm font-medium mb-2">
                        Sumber Lead (isi: Sumber Lead)
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto pr-1">
                        {meta.data!.sources.length ? (
                          meta.data!.sources.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="truncate">
                                <span className="font-medium text-foreground">
                                  {s.code}
                                </span>{" "}
                                — {s.name}
                              </span>
                              <span className="opacity-70">#{s.id}</span>
                            </div>
                          ))
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-sm font-medium mb-2">
                        Status (isi: Status Utama)
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto pr-1">
                        {meta.data!.statuses.length ? (
                          meta.data!.statuses.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="truncate">
                                <span className="font-medium text-foreground">
                                  {s.code}
                                </span>{" "}
                                — {s.name}
                              </span>
                              <span className="opacity-70">#{s.id}</span>
                            </div>
                          ))
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-sm font-medium mb-2">
                        Sub Status (isi: Sub Status)
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto pr-1">
                        {meta.data!.subStatuses.map((s) => (
                          <div
                            key={s.id}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              <span className="font-medium text-foreground">
                                {s.code}
                              </span>{" "}
                              — {s.name}
                            </span>
                            <span className="opacity-70">{s.status.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/40 p-3 mt-3">
                    <div className="text-sm font-medium mb-2">
                      Tahap (isi: Tahap Lead)
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto pr-1">
                      {meta.data!.stages.length ? (
                        meta.data!.stages.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="truncate">
                              <span className="font-medium text-foreground">
                                {s.code}
                              </span>{" "}
                              — {s.name}
                            </span>
                            <span className="opacity-70">#{s.id}</span>
                          </div>
                        ))
                      ) : (
                        <div>-</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* preview */}
          {stats && (
            <div className="rounded-lg border p-3 space-y-3">
              <div className="text-sm font-medium">Ringkasan Preview</div>

              <div className="text-sm text-muted-foreground">
                Total:{" "}
                <span className="font-medium text-foreground">
                  {stats.totalRows}
                </span>{" "}
                • Valid:{" "}
                <span className="font-medium text-foreground">
                  {stats.validRows}
                </span>{" "}
                • Dilewate:{" "}
                <span className="font-medium text-foreground">
                  {skipped.length}
                </span>{" "}
                • Invalid:{" "}
                <span className="font-medium text-foreground">
                  {stats.invalidRows}
                </span>
              </div>

              <Separator />

              {stats.invalidRows > 0 ? (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    Ada data invalid. Baris invalid tidak akan diimport.
                    <div className="text-xs text-muted-foreground">
                      Ditampilkan max 200 error pertama.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Semua baris valid.
                </div>
              )}

              {preview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Preview (10 pertama)
                  </div>

                  <div className="grid gap-2 max-h-64 overflow-auto pr-1">
                    {preview.map((r) => (
                      <div
                        key={r.rowNumber}
                        className="rounded-lg bg-muted/40 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">
                            Row {r.rowNumber}: {r.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.phone ? `+${r.phone}` : "phone: -"}
                          </div>
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Lead masuk:{" "}
                          <span className="font-medium text-foreground">
                            {fmtCreatedAt(r.createdAt)}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Alamat:{" "}
                          <span className="font-medium text-foreground">
                            {r.address ? `${r.address}` : "-"}
                          </span>
                        </div>

                        {r.city && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Kota:{" "}
                            <span className="font-medium text-foreground">
                              {r.city}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md border bg-background/60 p-2">
                            <div className="text-muted-foreground">Product</div>
                            <div className="font-medium">
                              {r.productName || "-"}
                            </div>
                            <div className="text-muted-foreground">
                              id: {r.productId ?? "-"}
                            </div>
                          </div>

                          <div className="rounded-md border bg-background/60 p-2">
                            <div className="text-muted-foreground">Mapping</div>
                            <div className="text-muted-foreground">
                              Source id:{" "}
                              <span className="font-medium text-foreground">
                                {r.sourceId ?? "-"}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Stage id:{" "}
                              <span className="font-medium text-foreground">
                                {r.stageId ?? "-"}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Status id:{" "}
                              <span className="font-medium text-foreground">
                                {r.statusId ?? "-"}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Sub Status id:{" "}
                              <span className="font-medium text-foreground">
                                {r.subStatusId ?? "-"}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 rounded-md border bg-background/60 p-2">
                            <div className="text-muted-foreground">
                              Harga (nullable)
                            </div>
                            <div className="mt-1 grid grid-cols-3 gap-2">
                              <div>
                                <div className="text-muted-foreground">
                                  Offering
                                </div>
                                <div className="font-medium">
                                  {fmtMoney(r.priceOffering)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Nego
                                </div>
                                <div className="font-medium">
                                  {fmtMoney(r.priceNegotiation)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Closing
                                </div>
                                <div className="font-medium">
                                  {fmtMoney(r.priceClosing)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Preview menampilkan hasil mapping ke ID (kalau kosong
                    berarti tidak diisi / nullable).
                  </div>
                </div>
              )}

              {skipped.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Dilewati (tidak diimport)
                  </div>

                  <div className="space-y-2 max-h-40 overflow-auto pr-1">
                    {skipped.map((s, i) => (
                      <div
                        key={`${s.rowNumber}-${i}`}
                        className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs"
                      >
                        <div className="font-medium">Row {s.rowNumber}</div>
                        <div className="text-muted-foreground">{s.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Error</div>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {errors.map((e, i) => (
                      <div
                        key={`${e.rowNumber}-${i}`}
                        className="rounded-lg border p-3"
                      >
                        <div className="text-sm font-semibold">
                          Row {e.rowNumber}
                        </div>
                        <ul className="list-disc pl-5 text-xs text-muted-foreground mt-2 space-y-1">
                          {e.messages.map((m, j) => (
                            <li key={j}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
