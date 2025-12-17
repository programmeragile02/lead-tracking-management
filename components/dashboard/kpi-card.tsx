import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  target?: number;
  actual?: number;
  count?: number;
  hot?: number;
  warm?: number;
  unit?: string;
  color: "red" | "orange" | "amber" | "coral" | "rose";
  format?: (value: number) => string;
}

export function KPICard({
  title,
  icon: Icon,
  target,
  actual,
  count,
  hot,
  warm,
  unit = "",
  color,
  format,
}: KPICardProps) {
  const percentage =
    target && actual && target > 0 ? Math.round((actual / target) * 100) : 0;

  const colorClasses = {
    red: "bg-primary",
    orange: "bg-accent",
    amber: "bg-accent/80",
    coral: "bg-primary/80",
    rose: "bg-destructive",
  };

  const bgColorClasses = {
    red: "bg-primary/25",
    orange: "bg-accent/25",
    amber: "bg-accent/25",
    coral: "bg-primary/25",
    rose: "bg-destructive/25",
  };

  const renderValue = (value: number | undefined) => {
    if (value === undefined) return "-";
    if (format) return format(value);
    return `${value} ${unit}`.trim();
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-md border border-border",
        bgColorClasses[color]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <div className={cn("p-3 rounded-xl shadow-lg", colorClasses[color])}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {target !== undefined && actual !== undefined ? (
        <>
          <div className="space-y-1 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Target:
              </span>
              <span className="font-semibold text-foreground">
                {renderValue(target)}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Actual:
              </span>
              <span className="text-3xl font-bold text-foreground">
                {renderValue(actual)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Progress
              </span>
              <span className="font-bold text-foregorund">{percentage}%</span>
            </div>
            <div className="h-3 bg-secondary/60 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn("h-full shadow-sm", colorClasses[color])}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </>
      ) : hot !== undefined && warm !== undefined ? (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              Hot:
            </span>
            <span className="text-3xl font-bold text-foreground">{hot}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              Warm:
            </span>
            <span className="text-2xl font-bold text-foreground">{warm}</span>
          </div>
        </div>
      ) : (
        <div>
          <span className="text-4xl font-bold text-foreground">{count}</span>
          {unit && (
            <span className="text-xl text-muted-foreground ml-1">{unit}</span>
          )}
        </div>
      )}
    </div>
  );
}
