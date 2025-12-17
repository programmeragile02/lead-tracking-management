"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AppRole, NavItem } from "@/lib/nav-items";
import { NAV_ITEMS } from "@/lib/nav-items";

interface MobileSidebarProps {
  role: AppRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  role,
  open,
  onOpenChange,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[role];

  // state group yang kebuka (bisa lebih dari satu)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isItemActive(item: NavItem): boolean {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }
    if (item.children) {
      return item.children.some((child) => child.href && isItemActive(child));
    }
    return false;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border bg-secondary">
          <SheetTitle className="text-foreground">Menu Navigasi</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const active = isItemActive(item);
            const hasChildren = !!item.children?.length;
            const Icon = item.icon;

            // item biasa (tanpa submenu)
            if (!hasChildren) {
              if (!item.href) return null;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    active
                      ? "bg-secondary text-white font-semibold border"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-sm"
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }

            // item dengan submenu (dropdown)
            const isOpen = openGroups[item.id] ?? true;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-secondary text-white font-semibold border"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    )}
                    <span className="truncate font-medium">{item.label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children!.map((child) => {
                      if (!child.href) return null;
                      const ChildIcon = child.icon;
                      const childActive = isItemActive(child);

                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all",
                            childActive
                              ? "bg-secondary text-white font-semibold border"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-sm"
                          )}
                        >
                          {ChildIcon && (
                            <ChildIcon
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                childActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-primary"
                              )}
                            />
                          )}
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
