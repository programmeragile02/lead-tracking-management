"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadSubStatuses } from "@/hooks/use-lead-sub-statuses";

export function SubStatusModal({
  open,
  onOpenChange,
  statusId,
  statusName,
  value,
  onChange,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  statusId: number | null;
  statusName?: string | null;
  value: number | null;
  onChange: (subStatusId: number) => void;
  loading?: boolean;
}) {
  const { subStatuses } = useLeadSubStatuses(statusId);
  const modalRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /* ===== posisi awal ke tengah ===== */
  useEffect(() => {
    if (!open) return;
    const w = 340;
    const h = 420;
    setPosition({
      x: window.innerWidth / 2 - w / 2,
      y: window.innerHeight / 2 - h / 2,
    });
  }, [open]);

  /* ===== DESKTOP ===== */
  const onMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".drag-handle")) return;

    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const move = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const stop = () => setDragging(false);

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
    };
  }, [dragging, dragStart]);

  /* ===== MOBILE ===== */
  const onTouchStart = (e: React.TouchEvent) => {
    if (!(e.target as HTMLElement).closest(".drag-handle")) return;

    const t = e.touches[0];
    setDragging(true);
    setDragStart({
      x: t.clientX - position.x,
      y: t.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      setPosition({
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      });
    };

    const stop = () => setDragging(false);

    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", stop);

    return () => {
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", stop);
    };
  }, [dragging, dragStart]);

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed z-50 bg-secondary rounded-xl shadow-2xl",
        dragging && "cursor-grabbing"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: 340,
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center justify-between p-4 border-b cursor-grab">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Ubah Sub Status</h3>
        </div>
        <button onClick={() => onOpenChange(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* STATUS UTAMA */}
      <div className="px-4 pt-3 pb-2">
        {statusId ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status utama</span>
            <Badge variant="secondary" className="rounded-full">
              {statusName}
            </Badge>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Pilih status utama terlebih dahulu
          </p>
        )}
      </div>

      {/* LIST */}
      <div className="px-4 pb-4">
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {subStatuses.map((s) => {
            const active = value === s.id;

            return (
              <button
                key={s.id}
                disabled={loading || active}
                onClick={() => {
                  onChange(s.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition",
                  "bg-background hover:bg-muted",
                  active && "ring-2 ring-primary border-primary",
                  (loading || active) && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{s.name}</span>
                  {active && (
                    <span className="text-xs button-primary font-medium">
                      ✓ Aktif
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {statusId && subStatuses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Tidak ada sub status untuk status ini
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
