"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PlaceholderRow } from "./placeholder-row";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Topic = {
  id: number;
  title: string;
  categoryId: number;
  category?: { id: number; name: string };
  templates?: any[];
};

export function TemplatePanel() {
  const { toast } = useToast();
  const [topicId, setTopicId] = useState<string>("");
  const [slot, setSlot] = useState<"A" | "B">("A");

  const topics = useSWR("/api/master/nurturing/topics", fetcher);
  const items: Topic[] = useMemo(() => topics.data?.data ?? [], [topics.data]);

  const selected = useMemo(
    () => items.find((x) => String(x.id) === topicId),
    [items, topicId]
  );

  const current = useMemo(() => {
    const list = selected?.templates ?? [];
    return list.find((t: any) => t.slot === slot) ?? null;
  }, [selected, slot]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // AUTO LOAD tiap ganti topik / slot / data SWR berubah
  useEffect(() => {
    setTitle(current?.waTemplateTitle ?? "");
    setBody(current?.waTemplateBody ?? "");
    setMedia(current?.waTemplateMedia ?? "");
    setIsActive(current?.isActive ?? true);
  }, [topicId, slot, current?.id]); // pakai current?.id biar stable

  async function saveTemplate() {
    if (!topicId) {
      toast({ title: "Pilih topik dulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/master/nurturing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: Number(topicId),
          slot,
          waTemplateTitle: title ? title : null,
          waTemplateBody: body ? body : null, // nullable
          waTemplateMedia: media ? media : null,
          isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal");
      toast({
        title: `Template ${slot} tersimpan`,
        description: selected?.title,
      });

      topics.mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const productHealth = useSWR("/api/products/link-health", fetcher);

  const missing = productHealth.data?.data?.missing ?? {
    demo: [],
    testi: [],
    edukasi: [],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Pilih Topik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Topik</div>
            <Select
              value={topicId}
              onValueChange={(v) => {
                setTopicId(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih topik/judul" />
              </SelectTrigger>
              <SelectContent>
                {items.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Slot Template</div>
            <Select value={slot} onValueChange={(v: any) => setSlot(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Template A</SelectItem>
                <SelectItem value="B">Template B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <Button
            variant="secondary"
            className="w-full"
            onClick={loadFromCurrent}
            disabled={!topicId}
          >
            Muat dari data tersimpan
          </Button> */}

          <div className="text-xs text-muted-foreground">
            Kamu bisa menyimpan body kosong (nullable) kalau ingin judul dulu.
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Editor Template {slot} {selected ? `• ${selected.title}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Judul Pesan WhatsApp</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Edukasi 1"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Pesan WhatsApp</div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis template... contoh: Halo {{nama_lead}}, ..."
              className="min-h-[180px]"
            />
            <div className="text-xs text-muted-foreground space-y-2">
              Placeholder yang dapat dipakai:
              <PlaceholderRow
                code={"{{nama_lead}}"}
                label="Nama lead"
                emptyText="Nama lead"
                missingProducts={[]}
              />
              <PlaceholderRow
                code={"{{nama_sales}}"}
                label="Nama sales"
                emptyText="Nama sales"
                missingProducts={[]}
              />
              <PlaceholderRow
                code={"{{produk}}"}
                label="Nama produk"
                emptyText="Nama produk belum diisi"
                missingProducts={[]}
              />
              <PlaceholderRow
                code={"{{perusahaan}}"}
                label="Nama perusahaan"
                emptyText="Konfigurasi di pengaturan umum"
                missingProducts={[]}
              />
              <PlaceholderRow
                code={"{{video_demo_links}}"}
                label="Link Video Demo"
                emptyText="Isi di halaman produk (url demo wajib diisi)."
                missingProducts={missing.demo}
              />
              <PlaceholderRow
                code={"{{testimoni_links}}"}
                label="Link Testimoni"
                emptyText="Isi di halaman produk (url testimoni wajib diisi)."
                missingProducts={missing.testi}
              />
              <PlaceholderRow
                code={"{{edukasi_links}}"}
                label="Link Edukasi"
                emptyText="Isi di halaman produk (url edukasi wajib diisi)."
                missingProducts={missing.edukasi}
              />
            </div>
          </div>

          {/* <div className="space-y-1">
            <div className="text-sm font-medium">Media URL (opsional)</div>
            <Input value={media} onChange={(e) => setMedia(e.target.value)} placeholder="https://..." />
          </div> */}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm">
              <div className="font-medium">Aktif</div>
              <div className="text-xs text-muted-foreground">
                Template aktif boleh dipakai plan
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            className="w-full"
            onClick={saveTemplate}
            disabled={saving || !topicId}
          >
            {saving ? "Menyimpan..." : "Simpan Template"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
