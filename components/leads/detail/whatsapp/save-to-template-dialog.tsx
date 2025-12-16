"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function suggestTitleFromText(text: string) {
  const t = String(text || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!t) return "Template Baru";
  const words = t.split(" ").slice(0, 6).join(" ");
  return words.length < t.length ? `${words}…` : words;
}

export function SaveToTemplateDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // pesan dari bubble sales
  messageText: string;
  messageType?: "TEXT" | "MEDIA";
  mediaUrl?: string | null;
  mediaName?: string | null;

  // setelah sukses simpan (optional)
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const {
    open,
    onOpenChange,
    messageText,
    messageType = "TEXT",
    mediaUrl,
    mediaName,
    onSaved,
  } = props;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Chat Tersimpan");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(suggestTitleFromText(messageText));
    setCategory("Chat Tersimpan");
    setBody(String(messageText || "").trim());
  }, [open, messageText]);

  const preview = useMemo(() => {
    if (messageType === "MEDIA") {
      return `${body || ""}\n\n[Lampiran: ${mediaName || "File"}]`;
    }
    return body || "";
  }, [body, messageType, mediaName]);

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Judul dan isi pesan wajib diisi.",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category: category.trim() || null,
          mediaUrl: mediaUrl ?? null,
          tags: ["from_chat"], // opsional
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan template");
      }

      toast({
        title: "Tersimpan",
        description: "Pesan berhasil disimpan ke Template Saya.",
      });

      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan template.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Simpan ke Template Saya</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Scope: USER</Badge>
            <Badge variant="outline">Milik sales (private)</Badge>
            {messageType === "MEDIA" ? (
              <Badge className="bg-emerald-500 text-white">MEDIA</Badge>
            ) : (
              <Badge className="bg-slate-200 text-slate-900">TEXT</Badge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Judul</p>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kategori</p>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Misal: Follow Up, Closing, Objection, dll"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Isi Pesan</p>
            <Textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Teks template..."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: kamu boleh ubah isi jadi versi template (misal tambah
              placeholder {`{lead_name}`} dll).
            </p>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preview
            </p>
            <pre className="whitespace-pre-wrap text-sm">{preview}</pre>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
