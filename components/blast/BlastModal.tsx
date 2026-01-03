"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface BlastModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  message: string;
  setMessage: (v: string) => void;
  filters: {
    status?: string;
    subStatus?: string;
    stage?: string;
    total?: number;
  };
}

export function BlastModal({
  open,
  onClose,
  onSubmit,
  message,
  setMessage,
  filters,
}: BlastModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* MODAL BOX */}
      <div
        className="relative z-10 w-full max-w-xl rounded-lg bg-card p-6 shadow-xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <h2 className="text-lg font-semibold mb-4">Kirim Pesan Broadcast</h2>

        {/* === INFO TARGET === */}
        <div className="space-y-2 text-sm">
          <div className="font-medium">Target Penerima</div>

          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <Badge variant="secondary">Status: {filters.status}</Badge>
            )}
            {filters.subStatus && (
              <Badge variant="secondary">Sub: {filters.subStatus}</Badge>
            )}
            {filters.stage && (
              <Badge variant="secondary">Stage: {filters.stage}</Badge>
            )}
            {filters.total !== undefined && (
              <Badge variant="outline">Total: {filters.total} lead</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* === MESSAGE PREVIEW === */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Isi Pesan</Label>
          <Textarea
            className="w-full min-h-[120px] border rounded-md p-3 text-sm"
            placeholder="Tulis pesan broadcast..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Kamu bisa gunakan placeholder:
            <br />
            <code className="bg-black">{`{{nama_lead}}`}</code>
            <br />
            <code className="bg-black">{`{{produk}}`}</code>
            <br />
            <code className="bg-black">{`{{sales}}`}</code>
            <br />
            <code className="bg-black">{`{{perusahaan}}`}</code>
          </p>
        </div>

        <Separator />

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={!message.trim()}>
            Kirim Pesan
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
