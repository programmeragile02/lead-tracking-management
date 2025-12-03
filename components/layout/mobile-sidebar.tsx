"use client";

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
  Footprints,
  FileChartColumn,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileSidebarProps {
  role: "sales" | "team-leader" | "manager";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  role,
  open,
  onOpenChange,
}: MobileSidebarProps) {
  const pathname = usePathname();

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
    {
      href: "/master/jabatan",
      label: "Master Jabatan",
      icon: BriefcaseBusiness,
    },
    { href: "/master/pegawai", label: "Master Pegawai", icon: BookUser },
    { href: "/master/products", label: "Master Produk", icon: Package },
    { href: "/master/tahap", label: "Master Tahap", icon: Footprints },
    {
      href: "/master/status",
      label: "Master Status Lead",
      icon: FileChartColumn,
    },
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-white">
        <SheetHeader className="p-4.5 border-b gradient-primary">
          <SheetTitle className="text-white text-lg">Menu Navigasi</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  isActive
                    ? "gradient-primary text-white font-semibold shadow-md"
                    : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
