"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";
import { getStatusClass } from "@/lib/lead-status";

interface StatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  value: number | null; // statusId aktif
  onChange: (statusId: number) => void;

  loading?: boolean;
}

export function StatusModal({
  open,
  onOpenChange,
  value,
  onChange,
  loading,
}: StatusModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { statuses } = useLeadStatuses();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    setPosition({
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 150,
    });
  }, [open]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const stop = () => setIsDragging(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", stop);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", stop);
    };
  }, [isDragging, dragStart]);

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed z-50 bg-secondary rounded-xl shadow-2xl",
        isDragging && "cursor-grabbing"
      )}
      style={{ left: position.x, top: position.y, width: 300 }}
      onMouseDown={handleMouseDown}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center justify-between p-4 border-b cursor-grab">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Ubah Status Lead</h3>
        </div>
        <button onClick={() => onOpenChange(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* OPTIONS */}
      <div className="p-4 space-y-2">
        {statuses.map((s) => {
          const isActive = value === s.id;

          return (
            <Button
              key={s.id}
              disabled={loading || isActive}
              onClick={() => {
                onChange(s.id); // FIX UTAMA
                onOpenChange(false);
              }}
              className={cn(
                "w-full justify-start text-white",
                getStatusClass(s.code),
                isActive && "ring-2 ring-foreground"
              )}
            >
              <span className="w-3 h-3 rounded-full bg-white/30 mr-2" />
              {s.name}
              {isActive && <span className="ml-auto text-xs">✓ Aktif</span>}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
