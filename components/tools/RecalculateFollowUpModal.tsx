"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { RefreshCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PlannedFU = {
  order: 1 | 2 | 3;
  delayDays: number;
  label: string;
};

type RecalcItem = {
  leadId: number;
  leadName: string;
  status: string | null;
  stage: string | null;
  fuCount: number;
  plannedFollowUps: PlannedFU[];
};

type RecalcResponse = {
  ok: boolean;
  summary: {
    totalLeads: number;
    willCreateFU1: number;
    willCreateFU2: number;
    willCreateFU3: number;
    skipped: number;
  };
  items: RecalcItem[];
};

export function RecalculateFollowUpModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  const [executing, setExecuting] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<RecalcResponse>(
    started ? "/api/tools/recalculate-followups" : null,
    fetcher
  );

  useEffect(() => {
    if (!open) {
      setStarted(false);
      setExecuting(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleExecute() {
    try {
      setExecuting(true);

      const res = await fetch("/api/tools/recalculate-followups/execute", {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok || !result?.ok) {
        throw new Error("Gagal membuat follow up otomatis");
      }

      toast({
        title: "Follow up berhasil dibuat",
        description: (
          <div className="space-y-1">
            <div>
              FU1: <b>{result.created.fu1}</b>
            </div>
            <div>
              FU2: <b>{result.created.fu2}</b>
            </div>
            <div>
              FU3: <b>{result.created.fu3}</b>
            </div>
          </div>
        ),
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({
        title: "Gagal menjalankan rekalkulasi",
        description: err?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  }

  const hasAction =
    data &&
    data.summary.willCreateFU1 +
      data.summary.willCreateFU2 +
      data.summary.willCreateFU3 >
      0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-background rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-lg">
        {/* HEADER */}
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">
            Rekalkulasi Follow Up Otomatis
          </h2>
          <p className="text-sm text-muted-foreground">
            Lead 30 hari terakhir (status Warm & Hot)
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {!started && (
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Sistem akan membuat Follow Up otomatis (FU1–FU3) untuk lead yang
                belum lengkap jadwalnya
              </p>

              <Button
                onClick={() => setStarted(true)}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Mulai Analisis
              </Button>
            </div>
          )}

          {started && isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCcw className="h-4 w-4 animate-spin" />
              Menganalisis lead...
            </div>
          )}

          {error && (
            <div className="text-sm text-primary">
              Gagal memuat data rekalkulasi
            </div>
          )}

          {data && (
            <>
              {/* SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sticky top-0 bg-background z-10 pb-3">
                <SummaryCard label="FU1" value={data.summary.willCreateFU1} />
                <SummaryCard label="FU2" value={data.summary.willCreateFU2} />
                <SummaryCard label="FU3" value={data.summary.willCreateFU3} />
                <SummaryCard label="Lewat" value={data.summary.skipped} />
              </div>

              {/* LIST */}
              <div className="border rounded-lg divide-y max-h-[360px] overflow-y-auto">
                {data.items.map((it) => (
                  <div
                    key={it.leadId}
                    className="p-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{it.leadName}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.status ?? "—"} · {it.stage ?? "—"}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap justify-end">
                      {it.plannedFollowUps.length === 0 ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Lengkap
                        </span>
                      ) : (
                        it.plannedFollowUps.map((fu) => (
                          <span
                            key={fu.order}
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              fu.order === 1 && "bg-blue-100 text-blue-700",
                              fu.order === 2 && "bg-orange-100 text-orange-700",
                              fu.order === 3 && "bg-purple-100 text-purple-700"
                            )}
                          >
                            {fu.label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={!hasAction || executing}
                >
                  {executing ? "Memproses..." : "Buat Follow Up Otomatis"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= helpers ================= */

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
