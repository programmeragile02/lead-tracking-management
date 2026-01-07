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
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  priceKind: "OFFERING" | "NEGOTIATION" | "CLOSING";
  priceInput: string;

  saving: boolean;

  /** handlers dari page */
  onChangeKind: (v: "OFFERING" | "NEGOTIATION" | "CLOSING") => void;
  onChangeInput: (v: string) => void;
  onSave: () => void;

  priceDate: string;
  priceTime: string;
  onChangeDate: (v: string) => void;
  onChangeTime: (v: string) => void;
}

export function PriceDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input / Update Harga</DialogTitle>
          <DialogDescription>
            Pilih jenis harga yang ingin diupdate, lalu isi nominalnya
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Segmented button: Penawaran / Nego / Closing */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={props.priceKind === "OFFERING" ? "default" : "outline"}
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => props.onChangeKind("OFFERING")}
            >
              Penawaran
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                props.priceKind === "NEGOTIATION" ? "default" : "outline"
              }
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => props.onChangeKind("NEGOTIATION")}
            >
              Negosiasi
            </Button>
            <Button
              type="button"
              size="sm"
              variant={props.priceKind === "CLOSING" ? "default" : "outline"}
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => props.onChangeKind("CLOSING")}
            >
              Closing
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] md:text-xs text-muted-foreground">
                Tanggal
              </label>
              <Input
                type="date"
                value={props.priceDate}
                onChange={(e) => props.onChangeDate(e.target.value)}
              />
            </div>

            <div className="space-y-1 hidden">
              <label className="text-[11px] text-muted-foreground">
                Jam (opsional)
              </label>
              <Input
                type="time"
                value={props.priceTime}
                onChange={(e) => props.onChangeTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] md:text-sm text-muted-foreground">
              {props.priceKind === "OFFERING" &&
                "Nominal penawaran awal yang kamu ajukan ke lead"}
              {props.priceKind === "NEGOTIATION" &&
                "Nominal hasil negosiasi terbaru dengan lead"}
              {props.priceKind === "CLOSING" &&
                "Nominal deal akhir saat lead benar-benar closing"}
            </p>

            <Input
              type="text"
              inputMode="numeric"
              className="h-9 text-xs md:text-sm"
              value={props.priceInput}
              onChange={(e) => props.onChangeInput(e.target.value)}
              placeholder="Masukkan harga disini.."
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Simpan satu per satu: mulai dari penawaran, lalu negosiasi, kemudian
            closing
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => props.onOpenChange(false)}
              disabled={props.saving}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs md:text-sm"
              onClick={props.onSave}
              disabled={props.saving}
            >
              {props.saving ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan harga"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
