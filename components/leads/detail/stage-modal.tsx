"use client";

import { useEffect, useRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}

export function StageModal({ open, onOpenChange, children }: StageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // center on open
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPosition({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 260,
    });
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(e: MouseEvent) {
      moveTo(e.clientX, e.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault(); // ⛔ stop page scroll
      const t = e.touches[0];
      moveTo(t.clientX, t.clientY);
    }

    function stop() {
      setIsDragging(false);
    }

    function moveTo(clientX: number, clientY: number) {
      const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 300);
      const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 400);

      setPosition({
        x: Math.max(0, Math.min(clientX - dragStart.x, maxX)),
        y: Math.max(0, Math.min(clientY - dragStart.y, maxY)),
      });
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stop);

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", stop);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stop);
    };
  }, [isDragging, dragStart]);

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed z-50 w-[300px] max-h-[90vh] rounded-xl border bg-background shadow-2xl",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: position.x,
        top: position.y,
        touchAction: "none", // penting untuk mobile
      }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest(".drag-handle")) {
          setIsDragging(true);
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          });
        }
      }}
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest(".drag-handle")) {
          const t = e.touches[0];
          setIsDragging(true);
          setDragStart({
            x: t.clientX - position.x,
            y: t.clientY - position.y,
          });
        }
      }}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center justify-between border-b bg-muted/40 p-4 cursor-grab">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-semibold">Tahapan Lead</p>
            <p className="text-xs text-muted-foreground">
              Klik & drag untuk pindah posisi
            </p>
          </div>
        </div>
        <button onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {children}
    </div>
  );
}
