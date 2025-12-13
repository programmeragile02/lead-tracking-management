"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Category = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  order: number;
};
type Topic = {
  id: number;
  title: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  categoryId: number;
  category?: Category;
  templates?: any[];
};

export function TopicPanel() {
  const { toast } = useToast();
  const cat = useSWR("/api/master/nurturing/categories", fetcher);
  const [categoryId, setCategoryId] = useState<string>("");

  const categories: Category[] = useMemo(
    () => cat.data?.data ?? [],
    [cat.data]
  );

  const topicsUrl = categoryId
    ? `/api/master/nurturing/topics?categoryId=${encodeURIComponent(
        categoryId
      )}`
    : `/api/master/nurturing/topics`;
  const topics = useSWR(topicsUrl, fetcher);

  const items: Topic[] = useMemo(() => topics.data?.data ?? [], [topics.data]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function addTopic() {
    if (!categoryId) {
      toast({ title: "Pilih kategori dulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/master/nurturing/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          title,
          description: desc ? desc : null,
          order: Number(order || 0),
          isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal");
      toast({ title: "Topik dibuat", description: json.data.title });
      setTitle("");
      setDesc("");
      setOrder("0");
      setIsActive(true);
      topics.mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: Topic) {
    const res = await fetch(`/api/master/nurturing/topics/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
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
    topics.mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Tambah Topik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Kategori</div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Judul</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Apa masalah umum user?"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Deskripsi (opsional)</div>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Catatan internal untuk tim..."
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
                Topik aktif bisa dipakai di plan nanti
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            className="w-full"
            onClick={addTopic}
            disabled={saving || !title.trim() || !categoryId}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Daftar Topik</CardTitle>
        </CardHeader>
        <CardContent>
          {topics.isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada topik.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.category?.name ?? "Kategori"} • Order {t.order}
                      </div>
                      {t.description ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {t.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        {t.isActive ? "Aktif" : "Nonaktif"}
                      </div>
                      <Switch
                        checked={t.isActive}
                        onCheckedChange={() => toggleActive(t)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Template: {t.templates?.length ?? 0} (A/B)
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
