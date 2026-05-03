"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

interface SidebarNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

// Custom AI Icon component
function AIIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <span className="text-xs font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">AI</span>
      <Sparkles className="w-2 h-2 absolute -top-0.5 -right-1 text-purple-400" />
    </div>
  )
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, customIcon: null },
  { id: "family", label: "Familia", icon: Users, customIcon: null },
  { id: "movements", label: "Movimientos", icon: ArrowRightLeft, customIcon: null },
  { id: "loria", label: "LorIA", icon: null, customIcon: "ai" },
  { id: "community", label: "Comunidad", icon: Gamepad2, customIcon: null },
  { id: "loricoins", label: "LoriCoins", icon: null, customIcon: "stellar" },
  { id: "premios", label: "Premios", icon: Gift, customIcon: null },
]

export function SidebarNav({
  currentSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: SidebarNavProps) {
  const { currentUser, isChildMode, setIsChildMode, selectedChild } = useApp()

  const renderIcon = (item: typeof navItems[0]) => {
    if (item.customIcon === "ai") {
      return <AIIcon className="w-5 h-5" />
    }
    if (item.customIcon === "stellar") {
      return (
        <Image 
          src="/images/stellar-logo.png" 
          alt="Stellar" 
          width={20} 
          height={20}
          className="w-5 h-5 object-contain"
        />
      )
    }
    if (item.icon) {
      const Icon = item.icon
      return <Icon className="w-5 h-5 shrink-0" />
    }
    return null
  }

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
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <Image 
                src="/images/loricoin-mascot.png" 
                alt="LoriCoin" 
                width={40} 
                height={40}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">LoriCoin</h1>
              <p className="text-xs text-white/70">Finanzas Tempranas</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto overflow-hidden">
            <Image 
              src="/images/loricoin-mascot.png" 
              alt="LoriCoin" 
              width={36} 
              height={36}
              className="w-9 h-9 object-contain"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hidden lg:flex"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Profile */}
      <div className={cn("p-4 border-b border-white/10", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-10 h-10 bg-white/20 border-2 border-yellow-400">
            <AvatarFallback className="text-xl bg-transparent">
              {isChildMode && selectedChild ? selectedChild.avatar : currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {isChildMode && selectedChild ? selectedChild.name : currentUser.name}
              </p>
              <p className="text-xs text-white/70">
                {isChildMode ? "Modo Nino" : "Modo Padre"}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between mt-3 bg-white/10 rounded-full px-3 py-2">
            <span className="text-sm text-white/90">Modo Nino</span>
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
            {renderIcon(item)}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.id === "premios" && (
              <span className="ml-auto text-xs bg-yellow-400 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Nuevo
              </span>
            )}
          </Button>
        ))}
      </nav>

      {/* Footer */}
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
      </div>
    </aside>
  )
}
