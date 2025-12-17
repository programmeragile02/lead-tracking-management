import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg bg-background p-3",
        highlight && "ring-1 ring-primary/30"
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}
