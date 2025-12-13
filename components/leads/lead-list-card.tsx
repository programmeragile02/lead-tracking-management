import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "../ui/switch";

interface LeadListCardProps {
  leadId: number | string;
  leadName: string;
  status: "hot" | "warm" | "cold" | "new" | "close_won" | "close_lost";
  product: string;
  channel: string;
  createdDate: string;
  leadAge: string;
  nextFollowUp?: string;
  followUpType?: string;
  indicator: "overdue" | "due-today" | "updated" | "normal";
  nurturingEnabled?: boolean;
}

export function LeadListCard({
  leadId,
  leadName,
  status,
  product,
  channel,
  createdDate,
  leadAge,
  nextFollowUp,
  followUpType,
  indicator,
  nurturingEnabled,
}: LeadListCardProps) {
  const statusColors = {
    new: "bg-amber-500 text-white border-amber-600",
    hot: "bg-red-500 text-white border-red-600",
    warm: "bg-orange-500 text-white border-orange-600",
    cold: "bg-blue-500 text-white border-blue-600",
    close_won: "bg-green-500 text-white border-green-600",
    close_lost: "bg-gray-500 text-white border-gray-600",
  };

  const statusLabels = {
    hot: "Hot",
    warm: "Warm",
    cold: "Cold",
    new: "Baru",
    close_lost: "Tutup",
    close_won: "Sukses",
  };

  const indicatorColors = {
    overdue: "bg-red-500",
    "due-today": "bg-orange-500",
    updated: "bg-green-500",
    normal: "bg-gray-200",
  };

  const { user } = useCurrentUser();
  const { toast } = useToast();
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
          : "Nurturing dihentikan sementara untuk lead ini.",
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

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className={cn("w-1.5", indicatorColors[indicator])} />

        <div className="flex-1 p-4">
          <div className="flex justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{leadName}</h4>
                  <Badge
                    className={cn(
                      "text-xs font-semibold border",
                      statusColors[status]
                    )}
                  >
                    {statusLabels[status]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {product} • {channel}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                <span className="text-[11px] font-medium text-slate-500 mr-1">
                  Umur lead
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {leadAge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
            <div className="text-sm">
              {nextFollowUp ? (
                <>
                  <span className="text-gray-600 font-medium">
                    Berikutnya:{" "}
                  </span>
                  <span className="font-bold text-gray-900">
                    {nextFollowUp}{" "}
                    {followUpType && (
                      <span className="text-purple-600">({followUpType})</span>
                    )}
                  </span>
                </>
              ) : (
                <span className="text-gray-500 font-medium">
                  Belum ada follow-up
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle nurturing */}
              {user?.roleCode === "SALES" && (
                <div
                  className="flex items-center gap-2 rounded-lg border px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      nurturingOn ? "text-green-600" : "text-gray-500"
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

              {/* Tombol detail */}
              {user?.roleCode === "SALES" && (
                <Link href={`/leads/${leadId}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 hover:bg-red-100 text-red-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
