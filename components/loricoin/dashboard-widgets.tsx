"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { isFuturePeriod, periodLabel, shiftPeriod, type Metrics, type Period } from "@/lib/loricoin/metrics"
import { cn } from "@/lib/utils"

export type Tone = "emerald" | "sky" | "pink" | "violet" | "amber" | "rose" | "teal" | "orange"

const TONES: Record<Tone, { card: string; icon: string }> = {
  emerald: { card: "bg-emerald-500 text-white", icon: "bg-white/25 text-white" },
  sky: { card: "bg-sky-500 text-white", icon: "bg-white/25 text-white" },
  pink: { card: "bg-pink-500 text-white", icon: "bg-white/25 text-white" },
  violet: { card: "bg-violet-500 text-white", icon: "bg-white/25 text-white" },
  amber: { card: "bg-amber-400 text-amber-950", icon: "bg-white/40 text-amber-950" },
  rose: { card: "bg-rose-500 text-white", icon: "bg-white/25 text-white" },
  teal: { card: "bg-teal-500 text-white", icon: "bg-white/25 text-white" },
  orange: { card: "bg-orange-400 text-orange-950", icon: "bg-white/40 text-orange-950" },
}

export function PeriodFilter({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Agrupar por" className="flex rounded-full bg-muted p-1">
        {(["month", "year"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={period.kind === kind}
            onClick={() => onChange({ ...period, kind })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              period.kind === kind ? "bg-card text-emerald-700 shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {kind === "month" ? "Mes" : "Año"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(shiftPeriod(period, -1))}
          aria-label="Período anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="min-w-32 text-center text-sm font-bold text-foreground" aria-live="polite">
          {periodLabel(period)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(shiftPeriod(period, 1))}
          disabled={isFuturePeriod(period)}
          aria-label="Período siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export function MetricTile({
  label,
  hint,
  value,
  icon: Icon,
  tone,
  coins = true,
}: {
  label: string
  hint?: string
  value: number
  icon: LucideIcon
  tone: Tone
  coins?: boolean
}) {
  const t = TONES[tone]
  return (
    <div className={cn("relative flex flex-col gap-3 overflow-hidden rounded-3xl p-4 shadow-sm", t.card)}>
      <span aria-hidden="true" className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />
      <span aria-hidden="true" className="absolute -bottom-6 right-6 h-10 w-10 rounded-full bg-white/10" />
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", t.icon)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-bold opacity-90">{label}</span>
        {coins ? (
          <CoinAmount amount={value} className="text-2xl font-extrabold text-inherit" />
        ) : (
          <span className="text-2xl font-extrabold">{value}</span>
        )}
        {hint && <span className="text-xs font-semibold opacity-80">{hint}</span>}
      </span>
    </div>
  )
}

export function FlowChart({ buckets }: { buckets: Metrics["buckets"] }) {
  const max = Math.max(1, ...buckets.flatMap((b) => [b.ingresos, b.egresos]))
  const empty = buckets.every((b) => b.ingresos === 0 && b.egresos === 0)

  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-foreground">Entra y sale</h2>
        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-pink-400" aria-hidden="true" /> Egresos y deudas
          </span>
        </div>
      </div>
      {empty ? (
        <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
          Todavía no hay movimientos en este período.
        </p>
      ) : (
        <ul className="flex h-40 items-end justify-between gap-1.5" aria-label="Ingresos y egresos por período">
          {buckets.map((b) => (
            <li key={b.label} className="flex h-full flex-1 flex-col items-center gap-1.5">
              <span className="sr-only">
                {b.label}: ingresos {b.ingresos}, egresos {b.egresos}
              </span>
              <div className="flex w-full flex-1 items-end justify-center gap-1" aria-hidden="true">
                <span
                  className="w-full max-w-4 rounded-full bg-emerald-500 transition-all"
                  style={{ height: `${Math.max(4, (b.ingresos / max) * 100)}%` }}
                />
                <span
                  className="w-full max-w-4 rounded-full bg-pink-400 transition-all"
                  style={{ height: `${Math.max(4, (b.egresos / max) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground" aria-hidden="true">
                {b.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CountPill({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: "sky" | "amber" | "violet" | "emerald"
  onClick?: () => void
}) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-3xl border bg-card p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", tones[tone])}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-2xl font-extrabold leading-none text-foreground">{value}</span>
        <span className="truncate text-sm font-bold text-muted-foreground">{label}</span>
      </span>
    </button>
  )
}
