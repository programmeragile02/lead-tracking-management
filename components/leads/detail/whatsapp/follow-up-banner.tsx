"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FollowUpBanner(props: {
  date: string;
  name: string;
  status: "OVERDUE" | "TODAY" | "UPCOMING" | "DONE";
  isDone: boolean;
  onDone?: () => void;
}) {
  const { date, name, status, isDone, onDone } = props;

  const statusClass = {
    OVERDUE: "bg-red-500/20 text-red-400 border-red-500/30",
    TODAY: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    DONE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  }[status];

  return (
    <div className="flex items-center gap-3 px-3 py-2 my-2 rounded-lg border border-[#2A3942] bg-[#111B21] text-xs text-[#E9EDEF]">
      {/* kiri */}
      <div className="flex-1 w-[95px] text-[#8696A0]">
        {new Date(date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>

      {/* tengah */}
      <div className="flex-1 flex items-center gap-3">
        <span className="font-medium">{name}</span>

        {!isDone && onDone && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px] border-[#2A3942] bg-[#0B141A]"
            onClick={onDone}
          >
            Tandai Selesai
          </Button>
        )}
      </div>

      {/* kanan */}
      <Badge variant="outline" className={cn("text-[10px]", statusClass)}>
        {status}
      </Badge>
    </div>
  );
}
