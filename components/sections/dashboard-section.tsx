"use client"

import Image from "next/image"
import { ArrowRight, Target, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ComingSoonGrid } from "@/components/coming-soon"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { goalProgress } from "@/lib/loricoin/goals"
import type { SectionId } from "@/lib/navigation"

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-0.5 p-3 md:gap-1 md:p-4">
        <span className="truncate text-xs text-muted-foreground md:text-sm">{label}</span>
        <span className="text-lg font-bold text-foreground md:text-2xl">{value}</span>
      </CardContent>
    </Card>
  )
}

export function DashboardSection({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const { profile, children, tasks, goals, isChildMode, balanceOf } = useApp()
  const firstName = profile?.name.split(" ")[0] ?? ""

  const toReview = tasks.filter((t) => t.status === "terminada").length
  const pending = tasks.filter((t) => t.status === "pendiente").length
  const paidTotal = tasks.filter((t) => t.status === "pagada").reduce((sum, t) => sum + t.reward, 0)
  const myBalance = balanceOf(profile?.id, profile?.lori_coins ?? 0)
  const activeGoal = isChildMode ? goals.find((g) => g.status === "activa") : undefined
  const goalSaved = activeGoal ? Math.max(0, myBalance - activeGoal.start_balance) : 0

  const callout = isChildMode
    ? pending > 0
      ? `Tenés ${pending} ${pending === 1 ? "tarea para hacer" : "tareas para hacer"}.`
      : "No tenés tareas pendientes. ¡Bien!"
    : children.length === 0
      ? "Empezá creando la cuenta de tu hijo o hija."
      : toReview > 0
        ? `Tenés ${toReview} ${toReview === 1 ? "tarea para revisar" : "tareas para revisar"}.`
        : "No hay tareas esperando tu aprobación."

  const cta =
    !isChildMode && children.length === 0
      ? { label: "Ir a Familia", to: "family" as const }
      : { label: "Ver tareas", to: "tasks" as const }

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <Card className="overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <CardContent className="flex items-center gap-4 p-4 md:p-5">
          <div className="relative hidden h-24 w-24 shrink-0 sm:block">
            <Image src={LORICOIN_IMAGES.coin} alt="" fill className="object-contain" unoptimized />
          </div>
          <div className="flex flex-1 flex-col gap-1 md:gap-2">
            <h1 className="text-balance text-xl font-bold md:text-2xl">Hola, {firstName}</h1>
            <p className="text-sm text-white/90 md:text-base">{callout}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 bg-white text-emerald-700 hover:bg-white/90"
            onClick={() => onNavigate(cta.to)}
          >
            {cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {isChildMode ? (
          <>
            <Stat label="Tus LoriCoins" value={<CoinAmount amount={myBalance} className="text-lg md:text-2xl" />} />
            <Stat label="Para hacer" value={pending} />
            <Stat label="En revisión" value={toReview} />
          </>
        ) : (
          <>
            <Stat label="Hijos" value={children.length} />
            <Stat label="Para revisar" value={toReview} />
            <Stat label="Pagadas" value={<CoinAmount amount={paidTotal} className="text-lg md:text-2xl" />} />
          </>
        )}
      </div>

      {activeGoal ? (
        <button
          type="button"
          onClick={() => onNavigate("metas")}
          className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-emerald-50/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Target className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-foreground">{activeGoal.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {Math.min(goalSaved, activeGoal.target)}/{activeGoal.target}
              </span>
            </span>
            <Progress value={goalProgress(goalSaved, activeGoal.target)} className="h-2" aria-label="Progreso de la meta" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onNavigate("ranking")}
          className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-emerald-50/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
            <Trophy className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">Ranking semanal de ahorro</span>
            <span className="truncate text-xs text-muted-foreground">Los 3 que más ahorran ganan 50 LoriCoins</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      )}

      <div className="hidden md:block">
        <ComingSoonGrid onNavigate={onNavigate} />
      </div>
    </div>
  )
}
