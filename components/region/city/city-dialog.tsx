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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { mutate } from "swr";
import type { City } from "@/types/region-types";

type ProvinceOption = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: City | null;
  provinces: ProvinceOption[];
};

export function CityDialog({ open, onOpenChange, editing, provinces }: Props) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "KOTA" as "KOTA" | "KABUPATEN",
    provinceId: "",
  });

  const [loading, setLoading] = useState(false);

  // sync saat edit / open
  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
        type: editing.type,
        provinceId: String(editing.province.id),
      });
    } else {
      setForm({
        code: "",
        name: "",
        type: "KOTA",
        provinceId: "",
      });
    }
  }, [editing, open]);

  const submit = async () => {
    if (!form.code || !form.name || !form.provinceId) {
      toast({
        variant: "destructive",
        title: "Validasi gagal",
        description: "Kode, nama, dan provinsi wajib diisi",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        editing ? `/api/master/cities/${editing.id}` : "/api/master/cities",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: form.code.trim(),
            name: form.name.trim(),
            type: form.type,
            provinceId: Number(form.provinceId),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan kota");
      }

      toast({
        title: "Berhasil",
        description: editing
          ? "Kota berhasil diperbarui"
          : "Kota berhasil ditambahkan",
      });

      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/master/cities")
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Kota / Kabupaten" : "Tambah Kota / Kabupaten"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Provinsi */}
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Select
                value={form.provinceId}
                onValueChange={(v) => setForm((p) => ({ ...p, provinceId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipe */}
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KOTA">Kota</SelectItem>
                  <SelectItem value="KABUPATEN">Kabupaten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kode */}
          <div className="space-y-2">
            <Label>Kode Kota</Label>
            <Input
              placeholder="Contoh: 32.73"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            />
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <Label>Nama Kota / Kabupaten</Label>
            <Input
              placeholder="Contoh: Bandung"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Action */}
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
