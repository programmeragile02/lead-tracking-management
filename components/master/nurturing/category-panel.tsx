"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Category = {
  id: number;
  code: string;
  name: string;
  order: number;
  isActive: boolean;
};

export function CategoryPanel() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR(
    "/api/master/nurturing/categories",
    fetcher
  );

  const items: Category[] = useMemo(() => data?.data ?? [], [data]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function addCategory() {
    setSaving(true);
    try {
      const res = await fetch("/api/master/nurturing/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          order: Number(order || 0),
          isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal");
      toast({ title: "Kategori dibuat", description: json.data.name });
      setName("");
      setCode("");
      setOrder("0");
      setIsActive(true);
      mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: Category) {
    const res = await fetch(`/api/master/nurturing/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      toast({
        title: "Gagal",
        description: json.error || "Error",
        variant: "destructive",
      });
      return;
    }
    mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Tambah Kategori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Nama</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Edukasi / Promo / Demo..."
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Code</div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="EDUKASI"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Urutan</div>
            <Input
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm">
              <div className="font-medium">Aktif</div>
              <div className="text-xs text-muted-foreground">
                Kategori aktif tampil di pilihan
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button
            className="w-full"
            onClick={addCategory}
            disabled={saving || !name.trim() || !code.trim()}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada kategori.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.code} • Order {c.order}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {c.isActive ? "Aktif" : "Nonaktif"}
                    </div>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={() => toggleActive(c)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
