"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AssignmentCard({ row }: { row: any }) {
  return (
    <div className="rounded-xl border-2 border-border bg-secondary p-4 space-y-3">
      {/* ===== SALES FLOW ===== */}
      <div className="grid grid-cols-3 gap-4">
        {/* ===== LEAD ===== */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Lead
          </div>
          <div className="font-semibold text-foreground text-base">
            {row.lead.name}
          </div>
        </div>

        {/* FROM */}
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">
            Dari Sales
          </div>
          <div className="font-medium text-foreground">
            {row.fromSales?.name || "—"}
          </div>
        </div>

        {/* TO */}
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">
            Dipindahkan ke Sales
          </div>
          <div className="font-semibold text-primary">{row.toSales.name}</div>
        </div>
      </div>

      {/* ===== ACTOR ===== */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Oleh</span>
        <span className="font-medium text-foreground">
          {row.assignedBy.name}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {row.assignedBy.role.code}
        </Badge>
      </div>

      {/* ===== REASON ===== */}
      {row.reason && (
        <div className="rounded-lg border bg-card px-3 py-2 text-xs italic text-muted-foreground">
          <span className="font-medium not-italic text-foreground">
            Alasan:
          </span>{" "}
          “{row.reason}”
        </div>
      )}

      {/* ===== TIME ===== */}
      <div className="text-[11px] text-muted-foreground">
        {new Date(row.createdAt).toLocaleString("id-ID")}
      </div>
    </div>
  );
}
