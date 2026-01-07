"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";

export function FollowUpDoneDialog(props: {
  open: boolean;

  // info follow up
  followUpLabel?: string; // contoh: "Follow Up 2"
  followUpChannel?: string; // WhatsApp / Call / Zoom / Visit
  scheduledAt?: string | null;

  // result
  resultType: string;
  setResultType: (v: any) => void;

  resultNote: string;
  setResultNote: (v: string) => void;

  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;

  options: {
    value: string;
    label: string;
    hint: string;
  }[];
}) {
  const {
    open,
    followUpLabel,
    followUpChannel,
    scheduledAt,
    resultType,
    setResultType,
    resultNote,
    setResultNote,
    saving,
    onClose,
    onSubmit,
    options,
  } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-background p-5 mb-10 md:mb-0 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Selesaikan Follow Up</h3>
          <p className="text-xs text-muted-foreground">
            Tentukan hasil dari tindak lanjut ini sebelum ditandai selesai
          </p>
        </div>

        {/* INFO FOLLOW UP */}
        {(followUpLabel || followUpChannel) && (
          <div className="rounded-lg border bg-muted p-3 text-sm space-y-1">
            <p className="font-medium">{followUpLabel ?? "Follow Up"}</p>
            <p className="text-xs text-muted-foreground">
              Aksi: {followUpChannel ?? "-"}
              {scheduledAt ? ` • Dijadwalkan ${scheduledAt}` : ""}
            </p>
          </div>
        )}

        {/* HASIL FOLLOW UP */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Hasil Follow Up <span className="text-red-500">*</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResultType(opt.value)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition cursor-pointer",
                  resultType === opt.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                )}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* CATATAN */}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Catatan Hasil <span className="text-red-500">*</span>
          </p>

          <Textarea
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: Sudah dijelaskan harga, lead minta follow up minggu depan"
            value={resultNote}
            onChange={(e) => setResultNote(e.target.value)}
          />
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={saving || !resultType || resultNote.trim().length < 5}
            onClick={onSubmit}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Menyimpan
              </>
            ) : (
              "Simpan & Tandai Selesai"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
