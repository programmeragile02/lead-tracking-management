"use client"

import { Bell, ChevronLeft, Menu } from "lucide-react"
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
import { useRouter } from "next/navigation"

interface TopBarProps {
  title: string
  showBack?: boolean
  onMenuClick?: () => void
}

export function TopBar({ title, showBack, onMenuClick }: TopBarProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b gradient-primary shadow-lg">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <span className="hidden sm:inline font-semibold text-sm lg:text-base text-white">{title}</span>
        </div>

        {/* Center - Mobile */}
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm sm:hidden text-white">{title}</h1>

        {/* Right */}
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
              <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700">Keluar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
