// "use client";

// import { useMemo } from "react";
// import { Bell, ChevronLeft, Menu } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useRouter } from "next/navigation";
// import { useToast } from "@/hooks/use-toast";
// import { useCurrentUser } from "@/hooks/use-current-user";

// interface TopBarProps {
//   title: string;
//   showBack?: boolean;
//   onMenuClick?: () => void;
// }

// export function TopBar({ title, showBack, onMenuClick }: TopBarProps) {
//   const router = useRouter();
//   const { toast } = useToast();
//   const { user, loading } = useCurrentUser();

//   const displayName = user?.name || "User";
//   const displayEmail = user?.email || "";
//   const initials = useMemo(() => {
//     if (user?.name) {
//       const parts = user.name.trim().split(" ");
//       if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//       return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
//     }
//     if (user?.email) {
//       return user.email.charAt(0).toUpperCase();
//     }
//     return "U";
//   }, [user]);

//   async function handleLogout() {
//     try {
//       await fetch("/api/auth/logout", {
//         method: "POST",
//       });

//       toast({
//         title: "Logout berhasil",
//         description: "Anda telah keluar dari sistem",
//       });

//       router.replace("/login");
//     } catch (error) {
//       console.error("Logout gagal:", error);
//       toast({
//         title: "Logout gagal",
//         description: "Tidak dapat terhubung ke server",
//         variant: "destructive",
//       });
//     }
//   }

//   return (
//     <header className="sticky top-0 z-50 w-full border-b gradient-primary shadow-lg">
//       <div className="flex h-16 items-center justify-between px-4 lg:px-8">
//         {/* Left */}
//         <div className="flex items-center gap-3">
//           {showBack ? (
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => router.back()}
//               className="lg:hidden text-white hover:bg-white/20"
//             >
//               <ChevronLeft className="h-5 w-5" />
//             </Button>
//           ) : (
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={onMenuClick}
//               className="lg:hidden text-white hover:bg-white/20"
//             >
//               <Menu className="h-5 w-5" />
//             </Button>
//           )}

//           <span className="hidden sm:inline font-semibold text-sm lg:text-base text-white">
//             {title}
//           </span>
//         </div>

//         {/* Center - Mobile */}
//         <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm sm:hidden text-white">
//           {title}
//         </h1>

//         {/* Right */}
//         <div className="flex items-center gap-2">
//           <Button
//             variant="ghost"
//             size="icon"
//             className="relative text-white hover:bg-white/20"
//           >
//             <Bell className="h-5 w-5" />
//             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
//           </Button>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="rounded-full hover:bg-white/20"
//               >
//                 <Avatar className="h-8 w-8">
//                   <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm border border-white/30">
//                     {loading ? "…" : initials}
//                   </AvatarFallback>
//                 </Avatar>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent
//               align="end"
//               className="w-56 bg-white border-gray-200 shadow-xl"
//             >
//               <DropdownMenuLabel className="bg-gray-50">
//                 <div className="flex flex-col space-y-1">
//                   <p className="text-sm font-medium text-gray-900">
//                     {loading ? "Memuat..." : displayName}
//                   </p>
//                   {displayEmail && (
//                     <p className="text-xs text-gray-500 truncate">
//                       {displayEmail}
//                     </p>
//                   )}
//                 </div>
//               </DropdownMenuLabel>
//               <DropdownMenuSeparator className="bg-gray-200" />
//               <DropdownMenuItem
//                 onClick={() => router.push("/profile")}
//                 className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
//               >
//                 Profil
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => router.push("/settings")}
//                 className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
//               >
//                 Pengaturan
//               </DropdownMenuItem>
//               <DropdownMenuSeparator className="bg-gray-200" />
//               <DropdownMenuItem
//                 onClick={handleLogout}
//                 className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer font-semibold"
//               >
//                 Keluar
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </header>
//   );
// }

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-red-100">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="lg:hidden text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* <span className="hidden sm:inline font-semibold text-sm text-slate-900">
            {title}
          </span> */}
        </div>

        {/* Center - Mobile title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm sm:hidden text-red-800">
          {title}
        </h1>

        {/* Right */}
        <div className="flex items-center gap-1.5">
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
  );
}
