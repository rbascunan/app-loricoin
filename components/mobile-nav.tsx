"use client"

import { cn } from "@/lib/utils"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import {
  LayoutDashboard,
  Users,
  Gift,
  Bot,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

interface MobileNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
}

const navItems = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard, type: "icon" },
  { id: "family", label: "Familia", icon: Users, type: "icon" },
  { id: "loria", label: "LorIA", icon: Bot, type: "ai" },
  { id: "loricoins", label: "Coins", icon: null, type: "coin" },
  { id: "premios", label: "Premios", icon: Gift, type: "icon" },
]

export function MobileNav({ currentSection, onSectionChange }: MobileNavProps) {
  const renderIcon = (item: typeof navItems[0], isActive: boolean) => {
    if (item.type === "ai") {
      return (
        <div className="relative">
          <Bot className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-muted-foreground")} />
          <div className="absolute -top-1 -right-1.5 flex items-center">
            <span className={cn(
              "text-[8px] font-bold",
              isActive ? "text-purple-600" : "text-muted-foreground"
            )}>AI</span>
            <Sparkles className={cn(
              "w-2 h-2",
              isActive ? "text-purple-500" : "text-muted-foreground/50"
            )} />
          </div>
        </div>
      )
    }
    if (item.type === "coin") {
      return (
        <div className="relative">
          <div className="w-5 h-5 rounded-full overflow-hidden">
            <Image 
              src={LORICOIN_IMAGES.coin}
              alt="LoriCoins" 
              width={20} 
              height={20}
              className={cn("w-full h-full object-cover", !isActive && "opacity-60")}
              unoptimized
            />
          </div>
          <Image 
            src={LORICOIN_IMAGES.stellar}
            alt="Stellar" 
            width={10} 
            height={10}
            className="absolute -bottom-0.5 -right-1 w-2.5 h-2.5 object-contain"
            unoptimized
          />
        </div>
      )
    }
    if (item.icon) {
      const Icon = item.icon
      return <Icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-muted-foreground")} />
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
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                isActive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              )}
            >
              {renderIcon(item, isActive)}
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold text-emerald-600"
              )}>{item.label}</span>
              {item.id === "premios" && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      {/* Creator credit for mobile */}
      <div className="text-center pb-1">
        <p className="text-[8px] text-muted-foreground/60">
          Desarrollado por Betito Bascunan gracias a Vercel
        </p>
      </div>
    </nav>
  )
}
