"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Award,
  ClipboardList,
  Hourglass,
  PiggyBank,
  ReceiptText,
  Target,
  Trophy,
  Users,
  Wallet,
  BadgeCheck,
  CircleMinus,
} from "lucide-react"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ComingSoonGrid } from "@/components/coming-soon"
import { CountPill, FlowChart, MetricTile, PeriodFilter } from "@/components/loricoin/dashboard-widgets"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { goalProgress } from "@/lib/loricoin/goals"
import { computeMetrics, currentPeriod, periodLabel, type Period } from "@/lib/loricoin/metrics"
import type { SectionId } from "@/lib/navigation"

export function DashboardSection({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const { profile, children, tasks, goals, penalties, redemptions, bonuses, isChildMode, balanceOf } = useApp()
  const [period, setPeriod] = useState<Period>(() => currentPeriod("month"))
  const firstName = profile?.name.split(" ")[0] ?? ""

  const metrics = useMemo(
    () => computeMetrics(period, { tasks, penalties, redemptions, bonuses, goals }),
    [period, tasks, penalties, redemptions, bonuses, goals],
  )

  const toReview = tasks.filter((t) => t.status === "terminada").length
  const pending = tasks.filter((t) => t.status === "pendiente").length
  const paidTotal = tasks.filter((t) => t.status === "pagada").reduce((sum, t) => sum + t.reward, 0)
  const myBalance = balanceOf(profile?.id, profile?.lori_coins ?? 0)
  const familyBalance = children.reduce((sum, c) => sum + balanceOf(c.id, c.lori_coins ?? 0), 0)
  const saldo = isChildMode ? myBalance : familyBalance
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

  const inPeriod = `en ${periodLabel(period).toLowerCase()}`

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <section className="relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-sm md:p-6">
        <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute bottom-[-30px] right-32 h-20 w-20 rounded-full bg-amber-300/30" />
        <div className="relative hidden h-24 w-24 shrink-0 sm:block">
          <Image src={LORICOIN_IMAGES.coin} alt="" fill className="object-contain" unoptimized />
        </div>
        <div className="relative flex flex-1 flex-col gap-1">
          <h1 className="text-balance text-2xl font-extrabold md:text-3xl">¡Hola, {firstName}!</h1>
          <p className="text-sm font-semibold text-white/90 md:text-base">{callout}</p>
        </div>
        <Button
          size="sm"
          className="relative shrink-0 rounded-full bg-white font-bold text-emerald-700 hover:bg-white/90"
          onClick={() => onNavigate(cta.to)}
        >
          {cta.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </section>

      <section aria-labelledby="hoy-title" className="flex flex-col gap-3">
        <h2 id="hoy-title" className="text-lg font-extrabold text-foreground">
          {isChildMode ? "Tu plan de hoy" : "Para hoy"}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {!isChildMode && (
            <CountPill label="Hijos" value={children.length} icon={Users} tone="emerald" onClick={() => onNavigate("family")} />
          )}
          <CountPill
            label="Para hacer"
            value={pending}
            icon={ClipboardList}
            tone="sky"
            onClick={() => onNavigate("tasks")}
          />
          <CountPill
            label={isChildMode ? "En revisión" : "Para revisar"}
            value={toReview}
            icon={Hourglass}
            tone="amber"
            onClick={() => onNavigate("tasks")}
          />
          <CountPill
            label="Metas ganadas"
            value={metrics.metasGanadas}
            icon={Award}
            tone="violet"
            onClick={() => onNavigate("metas")}
          />
        </div>
      </section>

      <section aria-labelledby="numeros-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="numeros-title" className="text-lg font-extrabold text-foreground">
            {isChildMode ? "Tus números" : "Números de la familia"}
          </h2>
          <PeriodFilter period={period} onChange={setPeriod} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetricTile label="Ingresos" hint={inPeriod} value={metrics.ingresos} icon={ArrowDownCircle} tone="emerald" />
          <MetricTile label="Egresos" hint="Canjes en la tienda" value={metrics.egresos} icon={ArrowUpCircle} tone="pink" />
          <MetricTile label="Saldo" hint={isChildMode ? "Lo que tenés hoy" : "Total de tus hijos"} value={saldo} icon={Wallet} tone="sky" />
          <MetricTile label="Presupuesto" hint="Planeado en tareas" value={metrics.presupuesto} icon={ReceiptText} tone="violet" />
          <MetricTile label="Ahorro" hint={inPeriod} value={metrics.ahorro} icon={PiggyBank} tone="amber" />
          <MetricTile label="Deuda" hint="Descuentos" value={metrics.deuda} icon={CircleMinus} tone="rose" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <FlowChart buckets={metrics.buckets} />

        <div className="flex flex-col gap-3">
          {!isChildMode && (
            <div className="flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <BadgeCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-muted-foreground">Pagadas en total</span>
                <CoinAmount amount={paidTotal} className="text-2xl font-extrabold" />
              </span>
            </div>
          )}

          {activeGoal ? (
            <button
              type="button"
              onClick={() => onNavigate("metas")}
              className="flex flex-col gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <Target className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-bold text-muted-foreground">Tu meta</span>
                  <span className="truncate font-extrabold text-foreground">{activeGoal.title}</span>
                </span>
              </span>
              <Progress value={goalProgress(goalSaved, activeGoal.target)} className="h-3" aria-label="Progreso de la meta" />
              <span className="text-xs font-bold text-muted-foreground">
                {Math.min(goalSaved, activeGoal.target)} de {activeGoal.target} LoriCoins
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onNavigate("ranking")}
            className="flex items-center gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-extrabold text-foreground">Ranking semanal</span>
              <span className="text-xs font-semibold text-muted-foreground">Los 3 que más ahorran ganan 50 LoriCoins</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <ComingSoonGrid onNavigate={onNavigate} />
      </div>
    </div>
  )
}
