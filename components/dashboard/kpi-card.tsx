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
    red: "bg-red-500",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    coral: "bg-red-400",
    rose: "bg-rose-500",
  };

  const bgColorClasses = {
    red: "bg-red-50",
    orange: "bg-orange-50",
    amber: "bg-amber-50",
    coral: "bg-red-50",
    rose: "bg-rose-50",
  };

  const renderValue = (value: number | undefined) => {
    if (value === undefined) return "-";
    if (format) return format(value);
    return `${value} ${unit}`.trim();
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-md border-2 border-white",
        bgColorClasses[color]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        <div className={cn("p-3 rounded-xl shadow-lg", colorClasses[color])}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {target !== undefined && actual !== undefined ? (
        <>
          <div className="space-y-1 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600 font-medium">Target:</span>
              <span className="font-semibold text-gray-800">
                {renderValue(target)}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600 font-medium">Actual:</span>
              <span className="text-3xl font-bold text-gray-900">
                {renderValue(actual)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
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
            <span className="text-sm text-gray-600 font-medium">Hot:</span>
            <span className="text-3xl font-bold text-gray-900">{hot}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-600 font-medium">Warm:</span>
            <span className="text-2xl font-bold text-gray-800">{warm}</span>
          </div>
        </div>
      ) : (
        <div>
          <span className="text-4xl font-bold text-gray-900">{count}</span>
          {unit && <span className="text-xl text-gray-600 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );
}
