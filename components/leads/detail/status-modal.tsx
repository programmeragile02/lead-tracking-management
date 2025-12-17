"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type LeadStatus = "new" | "cold" | "warm" | "hot" | "won" | "lost";

interface StatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  value: LeadStatus; // status aktif dari lead (REAL)
  onChange: (status: LeadStatus) => void;
  loading?: boolean;
}

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "Baru", color: "bg-gray-500 hover:bg-gray-600" },
  { value: "cold", label: "Cold", color: "bg-blue-500 hover:bg-blue-600" },
  { value: "warm", label: "Warm", color: "bg-orange-500 hover:bg-orange-600" },
  { value: "hot", label: "Hot", color: "bg-red-500 hover:bg-red-600" },
  { value: "won", label: "Close Won", color: "bg-green-500 hover:bg-green-600" },
  { value: "lost", label: "Close Lost", color: "bg-gray-700 hover:bg-gray-800" },
];

export function StatusModal({
  open,
  onOpenChange,
  value,
  onChange,
  loading,
}: StatusModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // aman SSR
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // set posisi awal saat client
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    setPosition({
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 150,
    });
  }, [open]);

  // ===== DRAG HANDLERS =====
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 300);
      const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 400);

      setPosition({
        x: Math.max(0, Math.min(clientX - dragStart.x, maxX)),
        y: Math.max(0, Math.min(clientY - dragStart.y, maxY)),
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    };

    const stop = () => setIsDragging(false);

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

  const handleStatusChange = (next: LeadStatus) => {
    if (loading || next === value) return;
    onChange(next);
    onOpenChange(false);
  };

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed z-50 bg-secondary rounded-xl shadow-2xl",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: 300,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center justify-between p-4 border-b cursor-grab bg-secondary rounded-t-xl">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Ubah Status Lead</h3>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* OPTIONS */}
      <div className="p-4 space-y-2">
        {statusOptions.map((s) => (
          <Button
            key={s.value}
            disabled={loading}
            onClick={() => handleStatusChange(s.value)}
            className={cn(
              "w-full justify-start text-white",
              s.color,
              value === s.value && "ring-2 ring-offset-0.5 ring-foreground"
            )}
          >
            <span className="w-3 h-3 rounded-full bg-white/30 mr-2" />
            {s.label}
            {value === s.value && (
              <span className="ml-auto text-xs">✓ Aktif</span>
            )}
          </Button>
        ))}
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          Klik & drag header untuk memindahkan
        </p>
      </div>
    </div>
  );
}
