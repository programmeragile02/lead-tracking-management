"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "../ui/label";
import { createPortal } from "react-dom";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: {
    status?: string;
    subStatus?: string;
    stage?: string;
    salesId?: string;
  };
  salesName?: string;
  totalLeads: number;
  onSuccess?: () => void;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  filters,
  salesName,
  totalLeads,
  onSuccess,
}: BulkAssignDialogProps) {
  if (!open) return null;

  const { toast } = useToast();
  const { data: salesData } = useSWR("/api/users/sales", fetcher);

  const [toSalesId, setToSalesId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!toSalesId) {
      toast({
        title: "Sales belum dipilih",
        description: "Silakan pilih sales tujuan.",
        variant: "destructive",
      });
      return;
    }

    if (!filters.status && !filters.subStatus && !filters.stage) {
      toast({
        title: "Filter belum dipilih",
        description: "Pilih minimal satu filter sebelum assign",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          toSalesId: Number(toSalesId),
          reason,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast({
        title: "Berhasil memindahkan lead",
        description: `${json.moved} lead berhasil dipindahkan`,
      });

      onOpenChange(false);
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* MODAL */}
      <div
        className="relative z-10 bg-card rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Assign Lead (Massal)</h2>
          <p className="text-sm text-muted-foreground">
            Lead akan dipindahkan ke sales yang dipilih
          </p>
        </div>

        {/* INFO FILTER */}
        <div className="rounded-md border bg-muted p-3 text-sm space-y-1">
          <div className="font-medium">Filter Aktif:</div>
          <ul className="list-disc ml-4 text-muted-foreground">
            {filters.status && <li>Status: {filters.status}</li>}
            {filters.subStatus && <li>Sub Status: {filters.subStatus}</li>}
            {filters.stage && <li>Stage ID: {filters.stage}</li>}
          </ul>
          <div className="rounded-md border bg-muted p-3 space-y-1">
            <div className="text-sm">
              <span className="font-medium">Sales:</span>{" "}
              <span className="font-semibold text-primary">
                {salesName || "-"}
              </span>
              <p className="text-xs text-muted-foreground">
                Sales dipilih yang akan dipindahkan leadnya
              </p>{" "}
            </div>
            <div className="text-sm text-muted-foreground">
              Total lead: <b className="text-primary">{totalLeads}</b>
            </div>
          </div>
        </div>

        {/* SELECT SALES */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pindahkan ke Sales</Label>
          <Select value={toSalesId} onValueChange={setToSalesId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih sales tujuan" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.data?.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ALASAN */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Alasan (opsional)</Label>
          <Textarea
            placeholder="Contoh: redistribusi beban kerja"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>Pindahkan</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
