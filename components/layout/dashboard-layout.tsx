"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { FAB } from "./fab";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Bell } from "lucide-react";
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

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: "sales" | "team-leader" | "manager";
  showBack?: boolean;
}

export function DashboardLayout({
  children,
  title,
  role,
  showBack,
}: DashboardLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useCurrentUser();

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
    <div className="min-h-screen bg-background">
      {!isDesktop && (
        <TopBar
          title={title}
          showBack={showBack}
          onMenuClick={() => setSidebarOpen(true)}
        />
      )}

      <div className="lg:flex lg:h-screen">
        {isDesktop && <Sidebar role={role} />}

        <main className="flex-1 flex flex-col overflow-hidden">
          {isDesktop && (
            <header className="sticky top-0 z-40 border-b gradient-primary shadow-lg px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">{title}</h1>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/20"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-white/20"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm border border-white/30">
                            {loading ? "…" : initials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-white border-gray-200 shadow-xl"
                    >
                      <DropdownMenuLabel className="bg-gray-50">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {loading ? "Memuat..." : displayName}
                          </p>
                          {displayEmail && (
                            <p className="text-xs text-gray-500 truncate">
                              {displayEmail}
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem
                        onClick={() => router.push("/profile")}
                        className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                      >
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/settings")}
                        className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                      >
                        Pengaturan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200" />
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

          <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:pb-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </div>
        </main>
      </div>

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
