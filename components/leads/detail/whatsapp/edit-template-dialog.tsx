"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

type TemplateItem = {
  id: number;
  title: string;
  body: string;
  mediaUrl?: string | null;
  category?: string | null;
  source: "GLOBAL" | "MY_TEMPLATE";
  globalId?: number | null; // kalau asal global (effective) ada
  parentId?: number | null;
};


export function EditTemplateDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: TemplateItem | null;
  onSaved: () => void;
}) {
  const { open, onOpenChange, template, onSaved } = props;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!template) return;
    setTitle(template.title || "");
    setBody(template.body || "");
  }, [template?.id]);

  async function ensureEditableTemplateId(): Promise<number> {
    if (!template) throw new Error("Template kosong");

    // kalau GLOBAL → buat override dulu
    if (template.source === "GLOBAL" && template.globalId) {
      const res = await fetch(
        `/api/whatsapp/templates/${template.globalId}/override`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal membuat override");
      return json.data.id as number;
    }

    // kalau MY_TEMPLATE → bisa langsung
    return template.id;
  }

  async function handleSave() {
    if (!template) return;
    if (!title.trim() || !body.trim()) return;

    try {
      setSaving(true);

      const editableId = await ensureEditableTemplateId();

      const res = await fetch(`/api/whatsapp/templates/${editableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menyimpan");

      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Template (Versi Saya)</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Judul</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Isi Pesan</p>
            <Textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
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
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
          >
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
