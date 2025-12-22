"use client";

import { useState } from "react";
import { Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSWRConfig } from "swr";

type TaskStatus = "overdue" | "today" | "upcoming" | "done";

interface TaskCardProps {
  followUpId: number;
  leadId: number;
  leadName: string;
  product: string;
  followUpType: string;
  nextActionAt: string; // ISO string
  status: TaskStatus;
  stageName?: string;
  statusName?: string;
  isDone: boolean;
  doneAt?: string | null;
}

export function TaskCard({
  followUpId,
  leadId,
  leadName,
  product,
  followUpType,
  nextActionAt,
  status,
  stageName,
  statusName,
  isDone,
  doneAt,
}: TaskCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  // status yang dipakai di UI:
  // kalau isDone true, paksa pakai "done"
  const effectiveStatus: TaskStatus = isDone ? "done" : status;

  // untuk input type="datetime-local"
  const initDateTimeLocal = (() => {
    const d = new Date(nextActionAt);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  })();

  const [newNextAction, setNewNextAction] = useState(initDateTimeLocal);
  const [reason, setReason] = useState("");

  const statusColors: Record<TaskStatus, string> = {
    overdue: "bg-red-100 text-red-700",
    today: "bg-orange-100 text-orange-700",
    upcoming: "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
  };

  const statusLabel: Record<TaskStatus, string> = {
    overdue: "Terlambat",
    today: "Hari Ini",
    upcoming: "Mendatang",
    done: "Selesai",
  };

  const date = new Date(nextActionAt);
  const dateStr = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const doneDate = doneAt ? new Date(doneAt) : null;
  const doneStr =
    doneDate &&
    doneDate.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleReschedule = async () => {
    if (!newNextAction) {
      toast({
        variant: "destructive",
        title: "Jadwal belum diisi",
        description: "Pilih tanggal dan jam baru untuk follow up.",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/followups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextActionAt: newNextAction,
          note: reason || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal reschedule follow up");
      }

      toast({
        title: "Berhasil di-reschedule",
        description: "Jadwal follow up berhasil diperbarui.",
      });

      setRescheduleOpen(false);
      setReason("");
      // refresh daftar tugas
      mutate("/api/tasks");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal reschedule",
        description: err.message || "Terjadi kesalahan saat menyimpan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async () => {
    if (isDone) return; // sudah selesai, jangan dobel klik

    setMarkingDone(true);
    try {
      const res = await fetch(`/api/followups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markDone: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menandai selesai");
      }

      toast({
        title: "Tugas selesai",
        description: "Follow up ini sudah ditandai sebagai selesai.",
      });

      mutate("/api/tasks");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menandai selesai",
        description: err.message || "Terjadi kesalahan saat menyimpan.",
      });
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "bg-secondary rounded-xl p-4 shadow-sm border",
          isDone && "opacity-90"
        )}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{leadName}</h4>
              <Badge
                className={cn(
                  "text-xs capitalize flex items-center gap-1",
                  statusColors[effectiveStatus]
                )}
              >
                {effectiveStatus === "done" && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {statusLabel[effectiveStatus]}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {product} • {followUpType}
            </p>

            {(stageName || statusName) && (
              <p className="text-xs text-muted-foreground">
                {stageName && <span>Tahap: {stageName}</span>}
                {stageName && statusName && <span> • </span>}
                {statusName && <span>Status: {statusName}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between pt-3 border-t gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {dateStr}, {timeStr}
              </span>
            </div>

            {isDone && doneStr && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Ditandai selesai: {doneStr}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant={isDone ? "outline" : "outline"}
              size="sm"
              onClick={handleMarkDone}
              disabled={isDone || markingDone}
              className={cn(
                "flex items-center gap-1",
                isDone && "cursor-default"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isDone
                ? "Sudah selesai"
                : markingDone
                ? "Menyimpan..."
                : "Tandai selesai"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(true)}
              disabled={markingDone}
            >
              Reschedule
            </Button>

            <Button
              size="sm"
              className="bg-primary text-white"
              onClick={() => router.push(`/leads/${leadId}`)}
              disabled={markingDone}
            >
              Buka Lead
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Reschedule */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Jadwal baru</label>
              <Input
                type="datetime-local"
                value={newNextAction}
                onChange={(e) => setNewNextAction(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">
                Alasan reschedule (opsional)
              </label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: lead minta dihubungi setelah gajian..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleReschedule} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
