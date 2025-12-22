"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ExcludedContactModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    note: "",
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        phone: initialData.phone ?? "",
        note: initialData.note ?? "",
        isActive: initialData.isActive ?? true,
      });
    } else {
      setForm({
        name: "",
        phone: "",
        note: "",
        isActive: true,
      });
    }
  }, [initialData]);

  async function submit() {
    const method = initialData ? "PUT" : "POST";
    const url = initialData
      ? `/api/settings/wa-excluded-contacts/${initialData.id}`
      : `/api/settings/wa-excluded-contacts`;

    await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Kontak" : "Tambah Kontak Pengecualian"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Nama Kontak</Label>
          <Input
            placeholder="Misalnya: Budi"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Label>Nomor Whatsapp</Label>
          <Input
            placeholder="Misalnya: 6281262xx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Label>Catatan (Opsional)</Label>
          <Textarea
            placeholder="Misalnya: nomor teman"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm">Aktifkan pengecualian</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
          </div>

          <Button className="w-full" onClick={submit}>
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
