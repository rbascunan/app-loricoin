"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Bot,
  Gamepad2,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

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
  { id: "loria", label: "LorIA", icon: Bot },
  { id: "community", label: "Comunidad", icon: Gamepad2 },
  { id: "loricoins", label: "LoriCoins", icon: Coins },
]

export function SidebarNav({
  currentSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: SidebarNavProps) {
  const { currentUser, isChildMode, setIsChildMode, selectedChild } = useApp()

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground h-screen transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">LoriCoin</h1>
              <p className="text-xs text-sidebar-foreground/70">Finanzas Tempranas</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto">
            <Coins className="w-6 h-6 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Profile */}
      <div className={cn("p-4 border-b border-sidebar-border", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-10 h-10 bg-primary/20">
            <AvatarFallback className="text-xl">
              {isChildMode && selectedChild ? selectedChild.avatar : currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {isChildMode && selectedChild ? selectedChild.name : currentUser.name}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {isChildMode ? "Modo Nino" : "Modo Padre"}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-sidebar-foreground/70">Modo Nino</span>
            <Switch
              checked={isChildMode}
              onCheckedChange={setIsChildMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                currentSection === item.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
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
