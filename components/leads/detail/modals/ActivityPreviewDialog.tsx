"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  title?: string;
  photoUrl?: string | null;
  description?: string | null;
  createdByName?: string | null;
  formattedAt?: string;
}

export function ActivityPreviewDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title || "Detail Aktivitas"}</DialogTitle>
          {props.formattedAt && (
            <DialogDescription>{props.formattedAt}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {props.photoUrl && (
            <div className="overflow-hidden rounded-xl border bg-black/5">
              <img
                src={props.photoUrl}
                alt={props.title || "Foto aktivitas"}
                className="max-h-[400px] w-full object-contain"
              />
            </div>
          )}

          {props.description && (
            <p className="whitespace-pre-line text-sm">{props.description}</p>
          )}

          {props.createdByName && (
            <p className="text-xs text-muted-foreground">
              Dibuat oleh {props.createdByName}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
