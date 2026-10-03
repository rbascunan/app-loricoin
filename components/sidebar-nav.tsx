"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES, WHITE_ICONS } from "@/lib/loricoin-assets"
import { MonadIcon } from "@/components/monad-icon"
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Gamepad2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gift,
  Bot,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface SidebarNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "family", label: "Familia", icon: Users },
  { id: "movements", label: "Movimientos", icon: ArrowRightLeft },
  { id: "loria", label: "LorIA", icon: Bot, rightIcon: "ai" },
  { id: "community", label: "Comunidad", icon: Gamepad2 },
  { id: "loricoins", label: "LoriCoins", icon: Coins, rightIcon: "monad" },
  { id: "premios", label: "Premios", icon: Gift, isNew: true },
]

export function SidebarNav({
  currentSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: SidebarNavProps) {
  const { currentUser, isChildMode, setIsChildMode, selectedChild } = useApp()

  // Get avatar info
  const avatarUrl = isChildMode && selectedChild 
    ? selectedChild.avatarUrl 
    : currentUser.avatarUrl

  const avatarFallback = isChildMode && selectedChild 
    ? selectedChild.avatar 
    : currentUser.avatar

  const userName = isChildMode && selectedChild 
    ? selectedChild.name 
    : currentUser.name

  return (
    <aside
      className={cn(
        "flex flex-col bg-gradient-to-b from-emerald-600 to-emerald-700 text-white h-screen transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header with Mascot */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
              <Image 
                src={LORICOIN_IMAGES.coin}
                alt="LoriCoin" 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">LoriCoin</h1>
              <p className="text-xs text-white/70">Finanzas Tempranas</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-12 rounded-full overflow-hidden mx-auto shrink-0">
            <Image 
              src={LORICOIN_IMAGES.coin}
              alt="LoriCoin" 
              width={48} 
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hidden lg:flex shrink-0"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Profile */}
      <div className={cn("p-4 border-b border-white/10", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-10 h-10 border-2 border-yellow-400">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />}
            <AvatarFallback className="text-xl bg-white/20">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-white/70">
                {isChildMode ? "Modo Estudiante" : "Modo Padre/Madre"}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between mt-3 bg-white/10 rounded-full px-3 py-2">
            <span className="text-sm text-white/90">Modo Estudiante</span>
            <Switch
              checked={isChildMode}
              onCheckedChange={setIsChildMode}
              className="data-[state=checked]:bg-yellow-400"
            />
          </div>
        )}
      </div>

      {/* Navigation with green scrollbar */}
      <ScrollArea className="flex-1 [&_[data-radix-scroll-area-thumb]]:bg-emerald-400/50 [&_[data-radix-scroll-area-scrollbar]]:bg-emerald-800/30">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white transition-all",
                  currentSection === item.id && "bg-white/20 text-white font-semibold shadow-lg",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => {
                  onSectionChange(item.id)
                  window.scrollTo({ top: 0, behavior: 'instant' })
                }}
              >
                {/* Left Icon - always white Lucide icon */}
                <Icon className="w-5 h-5 shrink-0" />
                
                {/* Label */}
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                
                {/* Right Icon - AI or Monad (white versions) */}
                {!collapsed && item.rightIcon === "ai" && (
                  <Image 
                    src={WHITE_ICONS.ai}
                    alt="AI" 
                    width={20} 
                    height={20}
                    className="w-5 h-5 object-contain"
                    unoptimized
                  />
                )}
                {!collapsed && item.rightIcon === "monad" && (
                  <MonadIcon className="w-5 h-5 shrink-0" />
                )}
                
                {/* New badge for Premios */}
                {!collapsed && item.isNew && (
                  <span className="text-xs bg-yellow-400 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Nuevo
                  </span>
                )}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer with Creator Credit */}
      <div className="p-2 border-t border-white/10">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Configuracion</span>}
        </Button>
        {!collapsed && (
          <p className="text-[10px] text-white/50 text-center mt-3 px-2">
            Desarrollado por Betito Bascunan
            <br />gracias a Vercel
          </p>
        )}
      </div>
    </aside>
  )
}
