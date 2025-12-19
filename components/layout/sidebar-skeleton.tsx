"use client";

import { cn } from "@/lib/utils";

export function SidebarSkeleton({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col h-screen sticky top-0 border-r border-border bg-sidebar animate-pulse",
        collapsed ? "lg:w-20" : "lg:w-64"
      )}
    >
      {/* Brand */}
      <div className="h-[61px] border-b border-border bg-secondary" />

      {/* Menu */}
      <div className="flex-1 p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-10 rounded-xl bg-muted",
              collapsed ? "mx-auto w-10" : "w-full"
            )}
          />
        ))}
      </div>

      {/* Footer user */}
      <div className="h-16 border-t border-border bg-secondary/50" />
    </aside>
  );
}
