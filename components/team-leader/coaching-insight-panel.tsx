// components/team-leader/coaching-insight-panel.tsx
import { Clock, Flame, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoachingInsightPanel({
  overdue,
  hot,
  untouched,
}: {
  overdue: number;
  hot: number;
  untouched: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InsightCard
        icon={Clock}
        title="Follow Up Terlambat"
        value={overdue}
        description="Lead melewati jadwal follow up"
        action="Intervensi Follow Up"
        color="red"
      />

      <InsightCard
        icon={Flame}
        title="HOT Belum Closing"
        value={hot}
        description="Negosiasi macet / belum ditutup"
        action="Coaching Negosiasi"
        color="amber"
      />

      <InsightCard
        icon={AlertTriangle}
        title="Lead Tidak Disentuh"
        value={untouched}
        description="Belum pernah ada follow up"
        action="Redistribusi Lead"
        color="slate"
      />
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  action,
  color,
}: any) {
  const colorMap = {
    red: "from-red-50 to-red-100 text-red-700",
    amber: "from-amber-50 to-amber-100 text-amber-700",
    slate: "from-slate-50 to-slate-100 text-slate-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border bg-gradient-to-br",
        colorMap[color]
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <p className="font-semibold">{title}</p>
      </div>

      <p className="mt-2 text-3xl font-bold">{value}</p>

      <p className="mt-1 text-xs opacity-80">{description}</p>

      <button className="mt-4 inline-flex items-center gap-1 text-xs font-medium hover:underline">
        {action}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
