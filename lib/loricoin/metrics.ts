import type { Bonus, Penalty, Redemption, SavingsGoal, Task } from "@/lib/loricoin/types"

export type PeriodKind = "month" | "year"

export interface Period {
  kind: PeriodKind
  year: number
  month: number
}

export interface Metrics {
  ingresos: number
  egresos: number
  deuda: number
  ahorro: number
  presupuesto: number
  metasGanadas: number
  buckets: { label: string; ingresos: number; egresos: number }[]
}

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MONTHS_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function currentPeriod(kind: PeriodKind = "month"): Period {
  const now = new Date()
  return { kind, year: now.getFullYear(), month: now.getMonth() }
}

export function shiftPeriod(p: Period, delta: number): Period {
  if (p.kind === "year") return { ...p, year: p.year + delta }
  const d = new Date(p.year, p.month + delta, 1)
  return { ...p, year: d.getFullYear(), month: d.getMonth() }
}

export function periodLabel(p: Period): string {
  return p.kind === "year" ? String(p.year) : `${MONTHS_LONG[p.month]} ${p.year}`
}

export function isFuturePeriod(p: Period): boolean {
  const now = currentPeriod(p.kind)
  return p.kind === "year" ? p.year >= now.year : p.year * 12 + p.month >= now.year * 12 + now.month
}

function bucketIndex(p: Period, date: Date): number | null {
  if (date.getFullYear() !== p.year) return null
  if (p.kind === "year") return date.getMonth()
  if (date.getMonth() !== p.month) return null
  return Math.min(Math.floor((date.getDate() - 1) / 7), 4)
}

interface Sources {
  tasks: Task[]
  penalties: Penalty[]
  redemptions: Redemption[]
  bonuses: Bonus[]
  goals: SavingsGoal[]
}

export function computeMetrics(p: Period, src: Sources): Metrics {
  const bucketCount = p.kind === "year" ? 12 : 5
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    label: p.kind === "year" ? MONTHS_SHORT[i] : `Sem ${i + 1}`,
    ingresos: 0,
    egresos: 0,
  }))

  let ingresos = 0
  let egresos = 0
  let deuda = 0
  let presupuesto = 0
  let metasGanadas = 0

  const add = (iso: string | null | undefined, amount: number, kind: "in" | "out" | "debt") => {
    if (!iso) return
    const idx = bucketIndex(p, new Date(iso))
    if (idx === null) return
    if (kind === "in") {
      ingresos += amount
      buckets[idx].ingresos += amount
    } else if (kind === "out") {
      egresos += amount
      buckets[idx].egresos += amount
    } else {
      deuda += amount
      buckets[idx].egresos += amount
    }
  }

  for (const t of src.tasks) {
    if (t.status === "pagada") add(t.resolved_at ?? t.created_at, t.reward, "in")
    if (t.status !== "rechazada" && bucketIndex(p, new Date(t.created_at)) !== null) presupuesto += t.reward
  }
  for (const b of src.bonuses) if (b.status === "pagada") add(b.paid_at ?? b.created_at, b.amount, "in")
  for (const r of src.redemptions) add(r.redeemed_at ?? r.created_at, r.price, "out")
  for (const pen of src.penalties) add(pen.created_at, pen.amount, "debt")
  for (const g of src.goals) {
    if (g.status === "cumplida" && g.completed_at && bucketIndex(p, new Date(g.completed_at)) !== null) metasGanadas++
  }

  return {
    ingresos,
    egresos,
    deuda,
    ahorro: Math.max(0, ingresos - egresos - deuda),
    presupuesto,
    metasGanadas,
    buckets,
  }
}
