import { LucideIcon } from "lucide-react";

export function OverviewInfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium leading-snug">{children}</div>
      </div>
    </div>
  );
}
