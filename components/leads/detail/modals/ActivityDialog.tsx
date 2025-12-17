"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  title: string;
  date: string;
  time: string;
  description: string;

  photo: File | null;
  photoPreview: string | null;

  saving: boolean;

  fileInputRef: React.RefObject<HTMLInputElement>;

  /** handlers dari page */
  onTitleChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;

  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onPhotoDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onClearPhoto: () => void;

  onPreview: () => void;
  onSave: () => void;

  formatFileSize: (size: number) => string;
}

export function ActivityDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Aktivitas Lead</DialogTitle>
          <DialogDescription>
            Catat aktivitas penting (kunjungan, meeting, demo, dsb) dan
            lampirkan foto bila perlu
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-sm">
          <div>
            <Label className="text-xs">Judul aktivitas</Label>
            <Input
              className="mt-1 h-9"
              placeholder="Contoh: Kunjungan ke toko cabang A"
              value={props.title}
              onChange={(e) => props.onTitleChange(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="date"
                className="mt-1 h-9"
                value={props.date}
                onChange={(e) => props.onDateChange(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Jam</Label>
              <Input
                type="time"
                className="mt-1 h-9"
                value={props.time}
                onChange={(e) => props.onTimeChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Deskripsi</Label>
            <Textarea
              rows={3}
              className="mt-1 text-sm"
              placeholder="Contoh: Menjelaskan paket profesional, calon pelanggan tertarik untuk trial 7 hari."
              value={props.description}
              onChange={(e) => props.onDescriptionChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Foto aktivitas (opsional)</Label>

            <input
              ref={props.fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={props.onPhotoChange}
            />

            {props.photoPreview ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-muted bg-muted/40 p-3">
                <button
                  type="button"
                  className="overflow-hidden rounded-lg border bg-background"
                  onClick={props.onPreview}
                >
                  <img
                    src={props.photoPreview}
                    alt="Foto aktivitas"
                    className="h-20 w-20 object-cover"
                  />
                </button>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {props.photo?.name || "Foto aktivitas"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {props.photo
                      ? `${props.formatFileSize(props.photo.size)} • Gambar`
                      : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => props.fileInputRef.current?.click()}
                      disabled={props.saving}
                    >
                      Ganti foto
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={props.onClearPhoto}
                      disabled={props.saving}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-muted bg-muted/30 p-4 text-center hover:border-primary/60 hover:bg-primary/5 md:flex-row md:text-left"
                onClick={() => props.fileInputRef.current?.click()}
                onDragOver={props.onPhotoDragOver}
                onDrop={props.onPhotoDrop}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    Upload foto aktivitas (opsional)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klik atau seret & lepas foto ke sini. Format JPG/PNG, ukuran
                    maksimal 2MB.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.fileInputRef.current?.click();
                  }}
                  disabled={props.saving}
                >
                  Pilih foto
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => props.onOpenChange(false)}
          >
            Batal
          </Button>
          <Button size="sm" onClick={props.onSave} disabled={props.saving}>
            {props.saving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Aktivitas"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
