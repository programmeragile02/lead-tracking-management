"use client";

import { useMemo } from "react";
import { Bell, ChevronLeft, Menu } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export function TopBar({ title, showBack, onMenuClick }: TopBarProps) {
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-secondary">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="lg:hidden text-muted-foreground hover:bg-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden text-muted-foreground hover:bg-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* <span className="hidden sm:inline font-semibold text-sm text-slate-900">
            {title}
          </span> */}
        </div>

        {/* Center - Mobile title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm sm:hidden text-primary">
          {title}
        </h1>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:bg-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-1 ring-foreground" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-secondary"
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
              className="w-56 bg-card border border-border shadow-xl"
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
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="text-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-primary hover:bg-destructive/10 hover:text-destructive cursor-pointer font-semibold"
              >
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
