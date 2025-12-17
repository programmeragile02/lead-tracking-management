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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  proposalFile: File | null;
  proposalCaption: string;

  uploading: boolean;

  fileInputRef: React.RefObject<HTMLInputElement>;

  /** handlers dari page */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onCaptionChange: (v: string) => void;
  onSend: () => void;

  /** utils */
  formatFileSize: (size: number) => string;
}

export function ProposalDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kirim Penawaran</DialogTitle>
          <DialogDescription>
            Upload file penawaran dalam bentuk PDF dan kirim langsung ke
            WhatsApp lead ini
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-4 text-sm">
          <div className="space-y-2">
            <Label className="text-xs">File penawaran</Label>

            <input
              ref={props.fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={props.onFileChange}
            />

            {props.proposalFile ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-muted bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {props.proposalFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {props.formatFileSize(props.proposalFile.size)} • PDF
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => props.fileInputRef.current?.click()}
                      disabled={props.uploading}
                    >
                      Ganti file
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={props.onClearFile}
                      disabled={props.uploading}
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
                onDragOver={props.onDragOver}
                onDrop={props.onDrop}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {props.uploading
                      ? "Mengupload file..."
                      : "Upload file penawaran"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klik atau seret & lepas file ke sini. Format PDF, ukuran
                    maksimal 5MB
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
                  disabled={props.uploading}
                >
                  Pilih file
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Pesan pendamping (opsional)</Label>
            <Textarea
              rows={3}
              className="mt-1 text-sm"
              placeholder="Contoh: Berikut kami lampirkan penawaran paket profesional Agile Store untuk bisnis Anda."
              value={props.proposalCaption}
              onChange={(e) => props.onCaptionChange(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            Batal
          </Button>
          <Button size="sm" onClick={props.onSend} disabled={props.uploading}>
            {props.uploading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Kirim Penawaran"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
