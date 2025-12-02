"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { TopBar } from "./top-bar"
import { BottomNav } from "./bottom-nav"
import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { FAB } from "./fab"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  role: "sales" | "team-leader" | "manager"
  showBack?: boolean
}

export function DashboardLayout({ children, title, role, showBack }: DashboardLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {!isDesktop && <TopBar title={title} showBack={showBack} onMenuClick={() => setSidebarOpen(true)} />}

      <div className="lg:flex lg:h-screen">
        {isDesktop && <Sidebar role={role} />}

        <main className="flex-1 flex flex-col overflow-hidden">
          {isDesktop && (
            <header className="sticky top-0 z-40 border-b gradient-primary shadow-lg px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">{title}</h1>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm border border-white/30">
                            A
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 shadow-xl">
                      <DropdownMenuLabel className="bg-gray-50">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-gray-900">Andi</p>
                          <p className="text-xs text-gray-500">andi@company.com</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                        Pengaturan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700">
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
          <MobileSidebar role={role} open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <BottomNav role={role} />
        </>
      )}
      <FAB />
    </div>
  )
}
