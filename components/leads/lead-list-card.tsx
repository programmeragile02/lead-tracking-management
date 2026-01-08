"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Switch } from "../ui/switch";
import { AssignLeadDialog } from "./assign-lead-dialog";
import { getStatusClass } from "@/lib/lead-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Ban, MoreVertical } from "lucide-react";

interface LeadListCardProps {
  leadId: number | string;
  leadName: string;
  statusCode?: string | null;
  statusLabel?: string | null;
  product: string;
  channel: string;
  createdDate: string;
  leadAge: string;
  nextFollowUp?: string;
  followUpType?: string;
  indicator: "overdue" | "due-today" | "updated" | "normal";
  nurturingEnabled?: boolean;
  importedFromExcel?: boolean;
  salesName?: string | null;
  teamLeaderName?: string | null;
  onExclude?: (leadId: number) => void;
  isUnreplied?: boolean;
  lastNote?: {
    content: string;
    authorName: string;
    createdAt: string;
  } | null;
}

export function LeadListCard({
  leadId,
  leadName,
  statusCode,
  statusLabel,
  product,
  channel,
  leadAge,
  nextFollowUp,
  followUpType,
  indicator,
  nurturingEnabled,
  importedFromExcel,
  salesName,
  teamLeaderName,
  createdDate,
  onExclude,
  isUnreplied,
  lastNote,
}: LeadListCardProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();

  const isSales = user?.roleSlug === "sales";
  const isTeamLeader = user?.roleSlug === "team-leader";
  const isManager = user?.roleSlug === "manager";

  const indicatorColors = {
    overdue: "bg-primary",
    "due-today": "bg-orange-500",
    updated: "bg-green-500",
    normal: "bg-muted-foreground",
  };

  const [nurturingOn, setNurturingOn] = useState(
    typeof nurturingEnabled === "boolean" ? nurturingEnabled : true
  );
  const [loadingNurturing, setLoadingNurturing] = useState(false);

  async function toggleNurturing(next: boolean) {
    if (loadingNurturing) return;

    setLoadingNurturing(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/nurturing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengubah nurturing");
      }

      setNurturingOn(next);

      toast({
        title: next ? "Nurturing diaktifkan" : "Nurturing dimatikan",
        description: next
          ? "Pesan nurturing akan berjalan otomatis."
          : "Nurturing dihentikan sementara.",
      });
    } catch (e: any) {
      toast({
        title: "Gagal",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoadingNurturing(false);
    }
  }

  const canOpenDetail = isSales || isTeamLeader || isManager;

  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => {
          if (canOpenDetail) {
            router.push(`/leads/${leadId}${window.location.search}`);
          }
        }}
        className={cn(
          "bg-secondary rounded-xl shadow-md border-2 border-border overflow-hidden transition-shadow",
          canOpenDetail && "cursor-pointer hover:shadow-lg hover:shadow-muted"
        )}
      >
        <div className="flex">
          {/* Indicator */}
          <div className={cn("w-1.5", indicatorColors[indicator])} />

          <div className="flex-1 p-4">
            {/* HEADER */}
            <div className="flex justify-between items-start gap-3 mb-2">
              {/* LEFT: Lead info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-foreground truncate">
                    {leadName}
                  </h4>
                  <Badge
                    className={cn(
                      "text-xs font-semibold",
                      getStatusClass(statusCode)
                    )}
                  >
                    {statusLabel ?? statusCode}
                  </Badge>

                  {isUnreplied && (
                    <span className="ml-2 rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs font-medium">
                      Chat belum dibalas
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground font-medium truncate">
                  {product} • {channel}
                </p>

                <p className="text-sm text-muted-foreground font-medium truncate">
                  Lead Masuk:{" "}
                  <span className="text-foreground">{createdDate}</span>
                </p>
                {lastNote ? (
                  <p className="text-sm text-muted-foreground font-medium truncate">
                    Catatan Terakhir:{" "}
                    <span className="text-foreground">{lastNote.content}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium truncate">
                    Catatan Terakhir: <span className="text-foreground">-</span>
                  </p>
                )}
              </div>

              {/* RIGHT: Owner + meta */}
              <div className="flex flex-col items-end gap-2 shrink-0 text-right">
                <div className="flex flex-row items-center gap-1">
                  {/* UMUR LEAD */}
                  <div className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5">
                    <span className="text-[10px] text-muted-foreground mr-1">
                      Umur
                    </span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {leadAge}
                    </span>
                  </div>

                  {importedFromExcel && (
                    <span className="inline-flex items-center rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-border">
                      Excel
                    </span>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExclude?.(leadId);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Kecualikan Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* OWNER / ASSIGN SALES */}
                {(isTeamLeader || isManager) && salesName && (
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="cursor-pointer select-none
                 border-primary/40 text-primary
                 hover:bg-primary hover:text-white
                 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignOpen(true);
                      }}
                    >
                      🧑‍💼 {salesName} ▾
                    </Badge>

                    <span className="text-[10px] text-muted-foreground">
                      Assign Sales
                    </span>
                  </div>
                )}

                {isManager && teamLeaderName && (
                  <div className="text-xs leading-tight text-foreground">
                    <span className="font-medium text-muted-foreground">
                      Team Leader:
                    </span>{" "}
                    {teamLeaderName}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-border">
              <div className="text-sm">
                {nextFollowUp ? (
                  <>
                    <span className="text-muted-foreground font-medium">
                      Berikutnya:{" "}
                    </span>
                    <span className="font-bold text-foreground">
                      {nextFollowUp}{" "}
                      {followUpType && (
                        <span className="text-primary">({followUpType})</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    Belum ada follow-up
                  </span>
                )}
              </div>

              {/* Switch nurturing (SALES only) */}
              {isSales && (
                <div
                  className="flex items-center gap-2 rounded-lg border px-2 py-1 bg-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      nurturingOn ? "text-green-400" : "text-foreground"
                    )}
                  >
                    Nurturing
                  </span>
                  <Switch
                    checked={nurturingOn}
                    disabled={loadingNurturing}
                    onCheckedChange={toggleNurturing}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AssignLeadDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        leadId={leadId}
        currentSalesName={salesName}
      />
    </>
  );
}
