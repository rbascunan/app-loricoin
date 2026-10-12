"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { getNavItems, type SectionId } from "@/lib/navigation"

interface SidebarNavProps {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
}

export function SidebarNav({ activeSection, onSectionChange }: SidebarNavProps) {
  const { isChildMode } = useApp()
  const items = getNavItems(isChildMode)

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-gradient-to-b from-emerald-600 to-teal-700 text-white md:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="relative h-12 w-12">
          <Image src={LORICOIN_IMAGES.coin} alt="" fill className="object-contain" unoptimized />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">LoriCoin</p>
          <p className="text-xs text-white/80">Finanzas tempranas</p>
        </div>
      </div>
      <nav aria-label="Principal" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = item.id === activeSection
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active ? "bg-white text-emerald-700 shadow-sm" : "text-white/90 hover:bg-white/10",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.ai && (
                    <span className="rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      IA
                    </span>
                  )}
                  {item.comingSoon && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-yellow-100 text-yellow-800" : "bg-white/20 text-white",
                      )}
                    >
                      Próximamente
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
