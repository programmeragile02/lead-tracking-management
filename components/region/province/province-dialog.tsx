"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { mutate } from "swr";
import type { Province } from "@/types/region-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Province | null;
};

export function ProvinceDialog({ open, onOpenChange, editing }: Props) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    code: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
      });
    } else {
      setForm({ code: "", name: "" });
    }
  }, [editing, open]);

  const submit = async () => {
    if (!form.code || !form.name) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Kode dan nama provinsi wajib diisi",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        editing
          ? `/api/master/provinces/${editing.id}`
          : "/api/master/provinces",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: form.code.trim(),
            name: form.name.trim(),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan provinsi");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Provinsi berhasil diperbarui"
          : "Provinsi berhasil ditambahkan",
      });

      await mutate(
        (key) =>
          typeof key === "string" && key.startsWith("/api/master/provinces")
      );

      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Provinsi" : "Tambah Provinsi"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kode Provinsi</Label>
            <Input
              placeholder="Contoh: 32"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Nama Provinsi</Label>
            <Input
              placeholder="Contoh: Jawa Barat"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
