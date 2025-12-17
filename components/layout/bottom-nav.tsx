"use client"

import { Home, Users, CheckSquare, User, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  role: "sales" | "team-leader" | "manager"
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()

  const salesNav = [
    { href: "/dashboard/sales", label: "Beranda", icon: Home },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/tasks", label: "Tugas", icon: CheckSquare },
    { href: "/profile", label: "Profil", icon: User },
  ]

  const teamLeaderNav = [
    { href: "/dashboard/team-leader", label: "Beranda", icon: Home },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/team", label: "Tim", icon: BarChart3 },
    { href: "/profile", label: "Profil", icon: User },
  ]

  const managerNav = [
    { href: "/dashboard/manager", label: "Beranda", icon: Home },
    { href: "/leads", label: "Lead", icon: Users },
    { href: "/reports", label: "Laporan", icon: BarChart3 },
    { href: "/profile", label: "Profil", icon: User },
  ]

  const navItems = role === "sales" ? salesNav : role === "team-leader" ? teamLeaderNav : managerNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-[0_-4px_12px_rgba(0,0,0,0.03)] lg:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
              )}
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
