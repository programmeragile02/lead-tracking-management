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
import { RealtimeListener } from "../realtime/realtime-listener";
import { SidebarSkeleton } from "./sidebar-skeleton";
import { MobileNavSkeleton } from "./mobilenav-skeleton";

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
  const role: AppRole = (user?.roleSlug as AppRole) ?? undefined;

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

  {
    isDesktop && loading && (
      <div className="lg:w-64 border-r border-border bg-sidebar animate-pulse">
        <div className="h-16 border-b" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RealtimeListener />
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
        {isDesktop && (
          <>
            {loading && <SidebarSkeleton collapsed={sidebarCollapsed} />}

            {!loading && user && (
              <Sidebar
                key={user.id}
                role={role!}
                collapsed={sidebarCollapsed}
              />
            )}
          </>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header */}
          {isDesktop && (
            <header className="sticky top-0 z-40 border-b border-border bg-secondary shadow-lg">
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
                    className="hidden lg:inline-flex h-8 w-8 text-muted-foreground hover:bg-card hover:text-primary"
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
                    className="relative text-muted-foreground hover:bg-foreground"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-1 ring-foreground" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-secondary0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm border border-border">
                            {loading ? "…" : initials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-card border-border shadow-xl"
                    >
                      <DropdownMenuLabel className="bg-secondary/50">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {loading ? "Memuat..." : displayName}
                          </p>
                          {displayEmail && (
                            <p className="text-xs text-muted-foreground">
                              {displayEmail}
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={() => router.push("/profile")}
                        className="text-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                      >
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-primary hover:bg-primary hover:text-primary cursor-pointer font-semibold"
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
          {loading && <MobileNavSkeleton />}

          {!loading && user && (
            <>
              <MobileSidebar
                key={user.id}
                role={role!}
                open={sidebarOpen}
                onOpenChange={setSidebarOpen}
              />
              <BottomNav role={role!} />
            </>
          )}
        </>
      )}

      <FAB />
    </div>
  );
}
