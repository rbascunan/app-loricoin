"use client"

import { useMemo, useState } from "react"
import { Bell, CheckCircle2, Gift, ListChecks, MinusCircle, PartyPopper, Target, Trophy, XCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useApp } from "@/lib/app-context"
import { buildNotifications, countUnread, type NotificationTone } from "@/lib/loricoin/notifications"

const TONES: Record<NotificationTone, { icon: LucideIcon; className: string }> = {
  task: { icon: ListChecks, className: "bg-sky-100 text-sky-700" },
  done: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  paid: { icon: PartyPopper, className: "bg-emerald-100 text-emerald-700" },
  rejected: { icon: XCircle, className: "bg-orange-100 text-orange-700" },
  penalty: { icon: MinusCircle, className: "bg-red-100 text-red-700" },
  prize: { icon: Gift, className: "bg-violet-100 text-violet-700" },
  bonus: { icon: Trophy, className: "bg-yellow-100 text-yellow-700" },
  goal: { icon: Target, className: "bg-teal-100 text-teal-700" },
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export function NotificationCenter() {
  const { profile, children, tasks, penalties, redemptions, bonuses, goals, isChildMode, markNotificationsSeen } = useApp()
  const [open, setOpen] = useState(false)
  const [seenAtOnOpen, setSeenAtOnOpen] = useState<string | null>(null)

  const notifications = useMemo(
    () =>
      buildNotifications({
        isChild: isChildMode,
        nameOf: (id) => (children.find((c) => c.id === id)?.name ?? "Tu hijo").split(" ")[0],
        tasks,
        penalties,
        redemptions,
        bonuses,
        goals,
      }),
    [isChildMode, children, tasks, penalties, redemptions, bonuses, goals],
  )

  const seenAt = profile?.notifications_seen_at ?? null
  const unread = countUnread(notifications, seenAt)
  const highlightSince = seenAtOnOpen ? Date.parse(seenAtOnOpen) : 0

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSeenAtOnOpen(seenAt ?? new Date(0).toISOString())
      if (unread > 0) void markNotificationsSeen()
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => handleOpenChange(true)}
        title="Notificaciones"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Notificaciones</SheetTitle>
            <SheetDescription>
              {isChildMode ? "Tus tareas, premios y metas." : "Lo que pasa con las tareas y premios de tu familia."}
            </SheetDescription>
          </SheetHeader>
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay notificaciones.</p>
          ) : (
            <ul className="flex flex-1 flex-col overflow-y-auto">
              {notifications.map((n) => {
                const tone = TONES[n.tone]
                const Icon = tone.icon
                const isNew = Date.parse(n.at) > highlightSince
                return (
                  <li key={n.id} className={`flex gap-3 border-b px-4 py-3 ${isNew ? "bg-emerald-50/70" : ""}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.className}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{n.title}</span>
                        {typeof n.amount === "number" && (
                          <span
                            className={`shrink-0 text-xs font-bold ${n.amount < 0 ? "text-red-600" : "text-emerald-700"}`}
                          >
                            {n.amount > 0 ? "+" : ""}
                            {n.amount} LC
                          </span>
                        )}
                      </div>
                      <span className="truncate text-sm text-muted-foreground">{n.body}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isNew && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-label="Nueva" />}
                        {formatWhen(n.at)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
