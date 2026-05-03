"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Gamepad2,
  Gift,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

interface MobileNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
}

// Custom AI Icon component
function AIIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <div className={cn("relative flex items-center justify-center w-5 h-5", className)}>
      <span className={cn(
        "text-[10px] font-bold",
        active ? "text-emerald-600" : "text-muted-foreground"
      )}>AI</span>
      <Sparkles className={cn(
        "w-1.5 h-1.5 absolute -top-0.5 -right-0.5",
        active ? "text-purple-500" : "text-muted-foreground"
      )} />
    </div>
  )
}

const navItems = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard, customIcon: null },
  { id: "family", label: "Familia", icon: Users, customIcon: null },
  { id: "loria", label: "LorIA", icon: null, customIcon: "ai" },
  { id: "loricoins", label: "Coins", icon: null, customIcon: "stellar" },
  { id: "premios", label: "Premios", icon: Gift, customIcon: null },
]

export function MobileNav({ currentSection, onSectionChange }: MobileNavProps) {
  const renderIcon = (item: typeof navItems[0], isActive: boolean) => {
    if (item.customIcon === "ai") {
      return <AIIcon active={isActive} />
    }
    if (item.customIcon === "stellar") {
      return (
        <Image 
          src="/images/stellar-logo.png" 
          alt="Stellar" 
          width={20} 
          height={20}
          className={cn("w-5 h-5 object-contain", !isActive && "opacity-60")}
        />
      )
    }
    if (item.icon) {
      const Icon = item.icon
      return <Icon className={cn("w-5 h-5", isActive && "text-emerald-600")} />
    }
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden shadow-lg">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = currentSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                isActive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              )}
            >
              {renderIcon(item, isActive)}
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>{item.label}</span>
              {item.id === "premios" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
