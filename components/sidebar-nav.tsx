"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Gamepad2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gift,
  Sparkles,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

interface SidebarNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, rightIcon: null },
  { id: "family", label: "Familia", icon: Users, rightIcon: null },
  { id: "movements", label: "Movimientos", icon: ArrowRightLeft, rightIcon: null },
  { id: "loria", label: "LorIA", icon: Bot, rightIcon: "ai" },
  { id: "community", label: "Comunidad", icon: Gamepad2, rightIcon: null },
  { id: "loricoins", label: "LoriCoins", icon: "coin", rightIcon: "stellar" },
  { id: "premios", label: "Premios", icon: Gift, rightIcon: null },
]

export function SidebarNav({
  currentSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: SidebarNavProps) {
  const { currentUser, isChildMode, setIsChildMode, selectedChild } = useApp()

  const renderLeftIcon = (item: typeof navItems[0]) => {
    if (item.icon === "coin") {
      return (
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
          <Image 
            src={LORICOIN_IMAGES.coin}
            alt="LoriCoins" 
            width={20} 
            height={20}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      )
    }
    if (typeof item.icon === "function") {
      const Icon = item.icon
      return <Icon className="w-5 h-5 shrink-0" />
    }
    return null
  }

  const renderRightIcon = (rightIcon: string | null) => {
    if (rightIcon === "ai") {
      return (
        <span className="ml-auto flex items-center gap-0.5 text-xs font-bold">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">AI</span>
          <Sparkles className="w-3 h-3 text-purple-400" />
        </span>
      )
    }
    if (rightIcon === "stellar") {
      return (
        <Image 
          src={LORICOIN_IMAGES.stellar}
          alt="Stellar" 
          width={18} 
          height={18}
          className="ml-auto w-4 h-4 object-contain opacity-80"
          unoptimized
        />
      )
    }
    return null
  }

  // Get avatar URL
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

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white transition-all",
              currentSection === item.id && "bg-white/20 text-white font-semibold shadow-lg",
              collapsed && "justify-center px-2"
            )}
            onClick={() => onSectionChange(item.id)}
          >
            {renderLeftIcon(item)}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.rightIcon && renderRightIcon(item.rightIcon)}
            {!collapsed && item.id === "premios" && (
              <span className="ml-auto text-xs bg-yellow-400 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Nuevo
              </span>
            )}
          </Button>
        ))}
      </nav>

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
