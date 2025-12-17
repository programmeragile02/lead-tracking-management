"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StageWithMeta {
  id: number;
  label: string;
  startedAt?: string | null;
  doneAt?: string | null;
  mode?: "NORMAL" | "SKIPPED" | null;
}

interface Props {
  stages: StageWithMeta[];
  currentStageId?: number;
  stageUpdating: boolean;
  stageChecklistSaving: number | null;
  onStageDone: () => void;
  onMarkDone: (stageId: number, mode?: "NORMAL" | "SKIPPED") => void;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuickStagePanel({
  stages,
  currentStageId,
  stageUpdating,
  stageChecklistSaving,
  onStageDone,
  onMarkDone,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const currentStage = stages.find((s) => s.id === currentStageId) ?? null;

  return (
    <CardContent className="space-y-2 text-xs sm:text-sm my-4">
      {/* ===== TAHAP AKTIF ===== */}
      <div className="space-y-1.5 rounded-md border bg-muted/40 p-2">
        <p className="text-[11px] md:text-sm">
          Tahap aktif:{" "}
          <span className="font-medium">{currentStage?.label || "-"}</span>
        </p>

        {stageUpdating && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Menyimpan tahapan...
          </p>
        )}

        <Button
          size="sm"
          className="h-7 px-2 text-[11px] md:text-sm w-full"
          onClick={onStageDone}
          disabled={stageUpdating || !currentStage}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Tandai selesai & lanjut
        </Button>
      </div>

      {/* ===== TOGGLE RIWAYAT ===== */}
      <button
        type="button"
        className="mt-1 flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-[11px] md:text-sm text-muted-foreground hover:bg-muted/70"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          {expanded
            ? "Sembunyikan riwayat tahapan"
            : "Lihat riwayat tahapan lengkap"}
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {/* ===== RIWAYAT ===== */}
      {expanded && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-background/90 p-2 space-y-2">
          {stages.map((s) => {
            const isDone = !!s.doneAt;
            const isSkipped = isDone && s.mode === "SKIPPED";
            const isActive = s.id === currentStageId;

            return (
              <button
                key={s.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-2 hover:bg-muted/60"
                onClick={() => {
                  if (isDone) return;
                  onMarkDone(s.id, "NORMAL");
                }}
                disabled={stageChecklistSaving === s.id}
              >
                <div className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        isSkipped ? "text-slate-400" : "text-emerald-500"
                      }`}
                    />
                  ) : (
                    <Circle
                      className={`h-4 w-4 ${
                        isActive ? "text-blue-500" : "text-muted-foreground"
                      }`}
                    />
                  )}

                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {s.label}{" "}
                      {isActive ? (
                        <span className="text-xs text-blue-500">(aktif)</span>
                      ) : null}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      {isDone
                        ? `Selesai: ${formatDateTime(s.doneAt!)}`
                        : s.startedAt
                        ? `Mulai: ${formatDateTime(s.startedAt)}`
                        : "Belum dimulai"}
                      {isSkipped ? " • SKIPPED" : ""}
                    </p>
                  </div>
                </div>

                {stageChecklistSaving === s.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </CardContent>
  );
}
