"use client";

import { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AssignLeadDialog({
  open,
  onOpenChange,
  leadId,
  currentSalesName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: number | string;
  currentSalesName?: string | null;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const { data } = useSWR(open ? "/api/users/sales" : null, fetcher);
  const salesList = data?.data ?? [];

  const [toSalesId, setToSalesId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedSales = salesList.find((s: any) => String(s.id) === toSalesId);

  async function submit() {
    if (!toSalesId) {
      toast({
        title: "Sales tujuan belum dipilih",
        description: "Silakan pilih sales yang akan menerima lead ini.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toSalesId: Number(toSalesId),
          reason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal memindahkan lead");
      }

      onOpenChange(false);
      setToSalesId("");
      setReason("");

      // 🔥 trigger refresh list
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: "Gagal memindahkan lead",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pindahkan Lead ke Sales Lain</DialogTitle>
          <DialogDescription>
            Gunakan fitur ini untuk memindahkan kepemilikan lead ke sales lain.
            Riwayat perpindahan akan tersimpan sebagai audit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* KONDISI SAAT INI */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1 flex  items-center gap-4">
            <div className="text-xs text-muted-foreground">Sales saat ini</div>
            <Badge variant="secondary">🧑‍💼 {currentSalesName || "-"}</Badge>
          </div>

          {/* PILIH SALES BARU */}
          <div className="space-y-2">
            <Label>Pindahkan ke sales</Label>
            <Select value={toSalesId} onValueChange={setToSalesId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sales tujuan" />
              </SelectTrigger>
              <SelectContent>
                {salesList.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSales && (
              <div className="text-xs text-muted-foreground">
                Lead akan berpindah ke{" "}
                <span className="font-medium text-foreground">
                  {selectedSales.name}
                </span>
              </div>
            )}
          </div>

          {/* ALASAN */}
          <div className="space-y-2">
            <Label>Alasan pemindahan (opsional)</Label>
            <Textarea
              placeholder="Contoh: redistribusi workload, sales cuti, dll"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Alasan ini akan tersimpan di histori perpindahan lead
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Memindahkan..." : "Pindahkan Lead"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
