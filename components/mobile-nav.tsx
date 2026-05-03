"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Bot,
  Users2,
  Coins,
  Gift,
} from "lucide-react"

interface MobileNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
}

const navItems = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "family", label: "Familia", icon: Users },
  { id: "movements", label: "Movim.", icon: ArrowLeftRight },
  { id: "loria", label: "LorIA", icon: Bot },
  { id: "community", label: "Comunidad", icon: Users2 },
  { id: "loricoins", label: "Coins", icon: Coins },
  { id: "premios", label: "Premios", icon: Gift },
]

export function MobileNav({ currentSection, onSectionChange }: MobileNavProps) {
  const handleSectionChange = (sectionId: string) => {
    onSectionChange(sectionId)
    // Scroll to top when changing section
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden shadow-lg safe-area-bottom">
      <div className="flex items-center justify-between px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = currentSection === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all flex-1 min-w-0",
                isActive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-emerald-600")} />
              <span className={cn(
                "text-[9px] font-medium truncate w-full text-center",
                isActive && "font-semibold text-emerald-600"
              )}>{item.label}</span>
              {item.id === "premios" && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      {/* Creator credit for mobile */}
      <div className="text-center pb-1 pt-0.5 border-t border-gray-100">
        <p className="text-[7px] text-muted-foreground/60">
          Desarrollado por Betito Bascunan gracias a Vercel
        </p>
      </div>
    </nav>
  )
}
