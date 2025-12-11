import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

            <div className="flex gap-2">
              <Link href={`/leads/${leadId}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-red-100 text-red-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
