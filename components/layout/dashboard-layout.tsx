"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { FAB } from "./fab";
import { TopBar } from "./top-bar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Bell, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { AppRole } from "@/lib/nav-items";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

export function DashboardLayout({
  children,
  title,
  showBack,
}: DashboardLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useCurrentUser();

  // role diambil dari user yang login
  const role: AppRole = (user?.roleSlug as AppRole) ?? "sales";

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari sistem",
      });

      router.replace("/login");
    } catch (error) {
      console.error("Logout gagal:", error);
      toast({
        title: "Logout gagal",
        description: "Tidak dapat terhubung ke server",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      {!isDesktop && (
        <TopBar
          title={title}
          showBack={showBack}
          onMenuClick={() => setSidebarOpen(true)}
        />
      )}

      <div className="lg:flex lg:h-screen">
        {/* Sidebar desktop */}
        {isDesktop && <Sidebar role={role} collapsed={sidebarCollapsed} />}

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header */}
          {isDesktop && (
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-red-50/80 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 px-6 py-3">
                {/* Kiri: judul + tombol collapse */}
                <div className="flex items-center gap-2">
                  {/* <h1 className="text-base lg:text-xl font-semibold text-slate-900">
                    {title}
                  </h1> */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden lg:inline-flex h-8 w-8 text-slate-700 hover:bg-slate-100 hover:text-red-600"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    aria-label={
                      sidebarCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"
                    }
                  >
                    {sidebarCollapsed ? (
                      <PanelRightOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Kanan: notif + profil */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-600 hover:bg-slate-100"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-slate-100"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-red-500/10 text-red-700 text-sm border border-red-100">
                            {loading ? "…" : initials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-white border border-slate-200 shadow-xl"
                    >
                      <DropdownMenuLabel className="bg-slate-50">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-slate-900">
                            {loading ? "Memuat..." : displayName}
                          </p>
                          {displayEmail && (
                            <p className="text-xs text-slate-500 truncate">
                              {displayEmail}
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-200" />
                      <DropdownMenuItem
                        onClick={() => router.push("/profile")}
                        className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/settings")}
                        className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        Pengaturan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-200" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer font-semibold"
                      >
                        Keluar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:pb-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile nav */}
      {!isDesktop && (
        <>
          <MobileSidebar
            role={role}
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
          />
          <BottomNav role={role} />
        </>
      )}

      <FAB />
    </div>
  );
}
