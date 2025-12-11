"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AppRole, NavItem } from "@/lib/nav-items";
import { NAV_ITEMS } from "@/lib/nav-items";

interface SidebarProps {
  role: AppRole;
  collapsed?: boolean;
}

export function Sidebar({ role, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const [openGroupId, setOpenGroupId] = useState<string | null>("master"); // default buka "Master"

  const navItems = NAV_ITEMS[role];

  const displayName = user?.name || "User";
  const displayRole =
    user?.roleName ||
    (role === "manager"
      ? "Manager"
      : role === "team-leader"
      ? "Team Leader"
      : "Sales");

  const initials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  }, [user]);

  // cek apakah path aktif
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
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col h-screen sticky top-0 border-r border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm transition-[width] duration-300",
        collapsed ? "lg:w-20" : "lg:w-64"
      )}
    >
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-200 bg-red-50">
        <div className="flex items-center justify-center">
          <h2 className="text-lg font-semibold tracking-tight text-red-800">
            {collapsed ? "LT" : "Lead Track"}
          </h2>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isItemActive(item);
          const hasChildren = !!item.children?.length;

          // item tanpa submenu (link biasa)
          if (!hasChildren) {
            if (!item.href) return null;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-red-50 text-red-700 font-semibold border border-red-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-red-700"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      active
                        ? "text-red-500"
                        : "text-slate-400 group-hover:text-red-500"
                    )}
                  />
                )}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          }

          // item dengan submenu
          const Icon = item.icon;
          const isOpen = !collapsed && (openGroupId === item.id || active); // biar auto kebuka kalau ada anak aktif

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() =>
                  setOpenGroupId((prev) => (prev === item.id ? null : item.id))
                }
                className={cn(
                  "w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-red-50 text-red-700 font-semibold border border-red-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-red-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        active
                          ? "text-red-500"
                          : "text-slate-400 group-hover:text-red-500"
                      )}
                    />
                  )}
                  {!collapsed && (
                    <span className="truncate font-medium">{item.label}</span>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-slate-400">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                )}
              </button>

              {/* submenu */}
              {isOpen && !collapsed && (
                <div className="ml-9 mt-1 space-y-0.5">
                  {item.children!.map((child) => {
                    if (!child.href) return null;
                    const ChildIcon = child.icon;
                    const childActive = isItemActive(child);

                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all",
                          childActive
                            ? "bg-red-50 text-red-700 font-semibold border border-red-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-red-700"
                        )}
                      >
                        {ChildIcon && (
                          <ChildIcon
                            className={cn(
                              "h-4 w-4 flex-shrink-0",
                              childActive
                                ? "text-red-500"
                                : "text-slate-300 group-hover:text-red-500"
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

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-red-500/10 text-red-700 text-sm font-semibold">
              {loading ? "…" : initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {loading ? "Memuat..." : displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">{displayRole}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
