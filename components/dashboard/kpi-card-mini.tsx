import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "flat";

interface KPICardMiniProps {
  title: string;
  value: number | string;
  delta?: number; // +7 / -3
  percentage?: number; // 12 (%)
  subtitle?: string; // "hari ini"
  danger?: boolean;
  color: "red" | "orange" | "amber" | "coral" | "rose";
}

export function KPICardMini({
  title,
  value,
  delta,
  percentage,
  subtitle = "hari ini",
  danger,
  color,
}: KPICardMiniProps) {
  const direction: TrendDirection =
    delta === undefined || delta === 0 ? "flat" : delta > 0 ? "up" : "down";

  const trendColor =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  const TrendIcon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
      ? ArrowDownRight
      : Minus;

  const bgColorClasses = {
    red: "bg-primary/25",
    orange: "bg-accent/25",
    amber: "bg-accent/25",
    coral: "bg-primary/25",
    rose: "bg-destructive/25",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        bgColorClasses[color],
        danger && "border-destructive/40"
      )}
    >
      <p className="text-foreground font-semibold">{title}</p>

      <div className="mt-1 text-3xl font-bold text-foreground">{value}</div>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <TrendIcon className={cn("h-4 w-4", trendColor)} />

        {delta !== undefined ? (
          <span className={cn("font-medium", trendColor)}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        ) : (
          <span className="text-muted-foreground">–</span>
        )}

        {percentage !== undefined && (
          <span className="text-muted-foreground">
            ({percentage > 0 ? "+" : ""}
            {percentage}%)
          </span>
        )}

        <span className="text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}
