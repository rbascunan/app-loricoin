"use client"

import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { explorerTxUrl } from "@/components/loricoin/solana-ui"
import { CoinAmount, EmptyState } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { formatDate } from "@/lib/loricoin/client-utils"

interface Movement {
  id: string
  title: string
  childId: string
  date: string
  amount: number
  signature: string | null
  kind: "pago" | "descuento"
}

export function MovementsSection() {
  const { tasks, penalties, children, isChildMode } = useApp()

  const movements: Movement[] = [
    ...tasks
      .filter((t) => t.status === "pagada")
      .map((t) => ({
        id: `t-${t.id}`,
        title: t.title,
        childId: t.child_id,
        date: t.resolved_at ?? t.created_at,
        amount: t.reward,
        signature: t.tx_signature,
        kind: "pago" as const,
      })),
    ...penalties.map((p) => ({
      id: `p-${p.id}`,
      title: p.reason,
      childId: p.child_id,
      date: p.created_at,
      amount: p.amount,
      signature: p.tx_signature,
      kind: "descuento" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const earned = movements.filter((m) => m.kind === "pago").reduce((s, m) => s + m.amount, 0)
  const deducted = movements.filter((m) => m.kind === "descuento").reduce((s, m) => s + m.amount, 0)
  const childName = (id: string) => children.find((c) => c.id === id)?.name ?? ""

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Movimientos</h1>
        <p className="text-muted-foreground">
          {isChildMode
            ? "Las LoriCoins que ganaste con tus tareas y los descuentos que te hicieron."
            : "Los pagos por tareas aprobadas y los descuentos que hiciste."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <span className="text-muted-foreground">{isChildMode ? "Total ganado" : "Total pagado"}</span>
            <CoinAmount amount={earned} className="text-2xl" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <span className="text-muted-foreground">Total descontado</span>
            <span className="flex items-center gap-1 text-red-700">
              -<CoinAmount amount={deducted} className="text-2xl" />
            </span>
          </CardContent>
        </Card>
      </div>

      {movements.length === 0 ? (
        <EmptyState
          title="Todavía no hay movimientos"
          description="Cuando se apruebe una tarea o se haga un descuento, aparece acá."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{m.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.kind === "descuento" ? "Descuento" : "Tarea aprobada"}
                      {!isChildMode && ` · ${childName(m.childId)}`} · {formatDate(m.date)}
                    </span>
                    {m.signature && (
                      <a
                        href={explorerTxUrl(m.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-700 underline-offset-2 hover:underline"
                      >
                        Ver en Solana Explorer
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">(se abre en otra pestaña)</span>
                      </a>
                    )}
                  </div>
                  <span
                    className={`flex items-center gap-1 ${m.kind === "descuento" ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {m.kind === "descuento" ? "-" : "+"}
                    <CoinAmount amount={m.amount} />
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
