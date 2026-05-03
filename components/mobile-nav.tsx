"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Bot,
  Gamepad2,
  Coins,
} from "lucide-react"

interface MobileNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
}

const navItems = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "family", label: "Familia", icon: Users },
  { id: "movements", label: "Movimientos", icon: ArrowRightLeft },
  { id: "loria", label: "LorIA", icon: Bot },
  { id: "community", label: "Comunidad", icon: Gamepad2 },
  { id: "loricoins", label: "Coins", icon: Coins },
]

export function MobileNav({ currentSection, onSectionChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
