"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { getNavItems, type SectionId } from "@/lib/navigation"

interface MobileNavProps {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
}

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const { isChildMode } = useApp()
  const items = getNavItems(isChildMode).filter((item) => item.mobile)

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.id === activeSection
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSectionChange(item.id)}
                aria-current={active ? "page" : undefined}
                aria-label={item.comingSoon ? `${item.label}, próximamente` : item.label}
                className={cn(
                  "relative flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-emerald-700" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.shortLabel}</span>
                {item.comingSoon && (
                  <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-yellow-400" aria-hidden="true" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
