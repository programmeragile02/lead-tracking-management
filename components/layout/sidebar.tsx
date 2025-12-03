"use client";

import { useMemo } from "react";
import {
  Home,
  Users,
  CheckSquare,
  User,
  BarChart3,
  Settings,
  Package,
  BookUser,
  Network,
  BriefcaseBusiness,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";

interface SidebarProps {
  role: "sales" | "team-leader" | "manager";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const salesNav = [
    { href: "/dashboard/sales", label: "Dashboard", icon: Home },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/tasks", label: "Tugas", icon: CheckSquare },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const teamLeaderNav = [
    { href: "/dashboard/team-leader", label: "Dashboard", icon: Home },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/team", label: "Tim", icon: BarChart3 },
    { href: "/tasks", label: "Tugas", icon: CheckSquare },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const managerNav = [
    { href: "/dashboard/manager", label: "Dashboard", icon: Home },
    { href: "/master/jabatan", label: "Master Jabatan", icon: BriefcaseBusiness },
    { href: "/master/pegawai", label: "Master Pegawai", icon: BookUser },
    { href: "/master/products", label: "Master Produk", icon: Package },
    { href: "/organisasi", label: "Struktur Organisasi", icon: Network },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/reports", label: "Laporan", icon: BarChart3 },
    { href: "/settings/fields", label: "Pengaturan", icon: Settings },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const navItems =
    role === "sales"
      ? salesNav
      : role === "team-leader"
      ? teamLeaderNav
      : managerNav;

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

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-sidebar shadow-sm h-screen sticky top-0">
      <div className="p-5 border-b bg-violet-500">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-bold text-white">Tracking Lead</h2>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive
                  ? "gradient-primary text-white font-semibold shadow-md"
                  : "text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-sm"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-white/50">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              {loading ? "…" : initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {loading ? "Memuat..." : displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">{displayRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
