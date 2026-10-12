"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CoinAmount, EmptyState } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { formatDate } from "@/lib/loricoin/client-utils"

export function MovementsSection() {
  const { tasks, children, isChildMode } = useApp()

  const payments = tasks
    .filter((t) => t.status === "pagada")
    .sort((a, b) => (b.resolved_at ?? "").localeCompare(a.resolved_at ?? ""))
  const total = payments.reduce((sum, t) => sum + t.reward, 0)
  const childName = (id: string) => children.find((c) => c.id === id)?.name ?? ""

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Movimientos</h1>
        <p className="text-muted-foreground">
          {isChildMode ? "Las LoriCoins que ganaste con tus tareas." : "Las LoriCoins que pagaste por tareas aprobadas."}
        </p>
      </header>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <span className="text-muted-foreground">{isChildMode ? "Total ganado" : "Total pagado"}</span>
          <CoinAmount amount={total} className="text-2xl" />
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <EmptyState
          title="Todavía no hay movimientos"
          description="Cuando se apruebe una tarea terminada, el pago aparece acá."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {payments.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {!isChildMode && `${childName(task.child_id)} · `}
                      {formatDate(task.resolved_at)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-700">
                    +<CoinAmount amount={task.reward} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
