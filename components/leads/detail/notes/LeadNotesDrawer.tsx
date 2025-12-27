"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Note = {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
};

export function LeadNotesDrawer({
  open,
  onClose,
  leadId,
}: {
  open: boolean;
  onClose: () => void;
  leadId: number;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  async function fetchNotes() {
    const res = await fetch(`/api/leads/${leadId}/notes`);
    const json = await res.json();
    if (json.ok) setNotes(json.data);
  }

  useEffect(() => {
    if (open) fetchNotes();
  }, [open]);

  async function submit() {
    if (!text.trim()) return;

    const url = editingId
      ? `/api/leads/${leadId}/notes/${editingId}`
      : `/api/leads/${leadId}/notes`;

    await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    setText("");
    setEditingId(null);
    fetchNotes();
  }

  async function removeNote(id: number) {
    await fetch(`/api/leads/${leadId}/notes/${id}`, { method: "DELETE" });
    setNoteToDelete(null);
    fetchNotes();
  }

  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end transition",
        open ? "visible" : "invisible"
      )}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* drawer */}
      <div
        className={cn(
          "relative w-full max-w-md h-full bg-background shadow-xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">Catatan untuk lead ini</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada catatan</p>
          )}

          {notes.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border bg-muted/50 p-3 space-y-1"
            >
              <div className="text-sm whitespace-pre-wrap">{n.content}</div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{n.author.name}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(n.id);
                      setText(n.content);
                    }}
                    className="hover:text-primary"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => setNoteToDelete(n)}
                    className="hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="border-t p-3 flex gap-2">
          <Textarea
            placeholder="Tulis catatan..."
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim()) submit();
              }
            }}
            className="resize-none min-h-[38px] max-h-[120px] overflow-y-auto"
          />

          <Button onClick={submit} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KONFIRMASI HAPUS */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-card rounded-lg p-5 w-[360px] space-y-3">
            <h3 className="font-semibold text-sm">Hapus Catatan ini?</h3>

            <div className="rounded-md border p-2 text-sm text-muted-foreground max-h-24 overflow-y-auto">
              {noteToDelete.content}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setNoteToDelete(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeNote(noteToDelete.id)}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
