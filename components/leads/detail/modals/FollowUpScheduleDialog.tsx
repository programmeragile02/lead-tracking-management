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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  followUpTypeCode: string;
  setFollowUpTypeCode: (v: string) => void;

  followUpDate: string;
  setFollowUpDate: (v: string) => void;

  followUpChannel: "wa" | "call" | "zoom" | "visit";
  setFollowUpChannel: (v: any) => void;

  followUpNote: string;
  setFollowUpNote: (v: string) => void;

  followUpTypes: any[];
  saving: boolean;
  onSave: () => void;
}

export function FollowUpScheduleDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atur Tindak Lanjut</DialogTitle>
          <DialogDescription>
            Tentukan jenis tindak lanjut, jadwal, dan Aksi untuk lead ini
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">
              Step / jenis tindak lanjut
            </p>
            <Select
              value={props.followUpTypeCode}
              onValueChange={(v) => props.setFollowUpTypeCode(v)}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Pilih tindak lanjut" />
              </SelectTrigger>
              <SelectContent>
                {props.followUpTypes.map((t) => (
                  <SelectItem key={t.id} value={t.code}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Tanggal</p>
              <Input
                type="date"
                className="mt-1 h-9"
                value={props.followUpDate}
                onChange={(e) => props.setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Aksi</p>
            <Select
              value={props.followUpChannel}
              onValueChange={(v) =>
                props.setFollowUpChannel(v as "wa" | "call" | "zoom" | "visit")
              }
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Pilih Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wa">WhatsApp</SelectItem>
                <SelectItem value="call">Telepon</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="visit">Kunjungan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Catatan tindak lanjut
            </p>
            <Textarea
              rows={3}
              className="mt-1"
              placeholder="Contoh: Follow up final sebelum kirim invoice, pastikan sudah oke dengan paket profesional."
              value={props.followUpNote}
              onChange={(e) => props.setFollowUpNote(e.target.value)}
            />
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
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
