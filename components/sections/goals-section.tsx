"use client"

import { useState } from "react"
import { Loader2, Plus, Target, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CoinAmount, EmptyState } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { formatDate } from "@/lib/loricoin/client-utils"
import { GOAL_LIMITS, goalProgress } from "@/lib/loricoin/goals"
import type { GoalStatus, SavingsGoal } from "@/lib/loricoin/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<GoalStatus, { label: string; className: string }> = {
  activa: { label: "En curso", className: "bg-teal-100 text-teal-800" },
  cumplida: { label: "Cumplida", className: "bg-emerald-100 text-emerald-800" },
  vencida: { label: "Vencida", className: "bg-slate-100 text-slate-700" },
  cancelada: { label: "Cancelada", className: "bg-slate-100 text-slate-700" },
}

function GoalForm({ onDone }: { onDone: () => void }) {
  const { children, refresh } = useApp()
  const [childId, setChildId] = useState(children[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("200")
  const [bonus, setBonus] = useState("20")
  const [months, setMonths] = useState("3")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, title, target: Number(target), bonus: Number(bonus), months: Number(months) }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? "No pudimos crear la meta")
      await refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la meta")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Nueva meta de ahorro</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-child">Hijo o hija</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger id="goal-child">
                <SelectValue placeholder="Elegí" />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-title">¿Para qué ahorra?</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={GOAL_LIMITS.title}
              placeholder="Ej: un drone de la tienda, una salida al cine"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-target">LoriCoins a ahorrar</Label>
            <Input
              id="goal-target"
              type="number"
              inputMode="numeric"
              min={GOAL_LIMITS.minTarget}
              max={GOAL_LIMITS.maxTarget}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-months">Plazo</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger id="goal-months">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 9, 12].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} {m === 1 ? "mes" : "meses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-bonus">Premio extra si la cumple</Label>
            <Input
              id="goal-bonus"
              type="number"
              inputMode="numeric"
              min={GOAL_LIMITS.minBonus}
              max={GOAL_LIMITS.maxBonus}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              required
            />
            <span className="text-xs text-muted-foreground">
              {`Entre ${GOAL_LIMITS.minBonus} y ${GOAL_LIMITS.maxBonus} LoriCoins. Hasta ${GOAL_LIMITS.maxActivePerChild} metas activas por hijo.`}
            </span>
          </div>
          <div className="flex items-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !childId} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Crear meta
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function GoalCard({ goal, balance, childName, canCancel }: { goal: SavingsGoal; balance: number; childName?: string; canCancel: boolean }) {
  const { refresh } = useApp()
  const [busy, setBusy] = useState(false)
  const saved = goal.status === "cumplida" ? goal.target : Math.max(0, balance - goal.start_balance)
  const percent = goalProgress(saved, goal.target)
  const status = STATUS_LABEL[goal.status]

  const cancel = async () => {
    setBusy(true)
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" })
    await refresh()
    setBusy(false)
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Target className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-semibold text-foreground">{goal.title}</span>
            <span className="text-xs text-muted-foreground">
              {childName && `${childName} · `}Hasta el {formatDate(goal.ends_at)}
            </span>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", status.className)}>
            {status.label}
          </span>
        </div>
        <Progress value={percent} className="h-2.5" aria-label={`Progreso: ${percent}%`} />
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {Math.min(saved, goal.target)} de {goal.target} ahorradas
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            Premio +<CoinAmount amount={goal.bonus} />
          </span>
        </div>
        {canCancel && goal.status === "activa" && (
          <Button variant="ghost" size="sm" className="self-end text-red-700 hover:text-red-800" onClick={cancel} disabled={busy}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Cancelar meta
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function GoalsSection() {
  const { goals, children, profile, isChildMode, balanceOf } = useApp()
  const [showForm, setShowForm] = useState(false)

  const balanceFor = (childId: string) => {
    if (isChildMode) return balanceOf(profile?.id, profile?.lori_coins ?? 0)
    const child = children.find((c) => c.id === childId)
    return balanceOf(childId, child?.lori_coins ?? 0)
  }
  const sorted = [...goals].sort((a, b) => Number(b.status === "activa") - Number(a.status === "activa") || b.created_at.localeCompare(a.created_at))

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas de ahorro</h1>
          <p className="text-muted-foreground">
            {isChildMode
              ? "Juntá LoriCoins para tu meta. Si la cumplís a tiempo, ganás un premio extra."
              : "Poné una meta a tus hijos. Si la cumplen en el plazo, ganan LoriCoins extra."}
          </p>
        </div>
        {!isChildMode && !showForm && children.length > 0 && (
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva meta
          </Button>
        )}
      </header>

      {showForm && <GoalForm onDone={() => setShowForm(false)} />}

      {sorted.length === 0 ? (
        <EmptyState
          title="Todavía no hay metas"
          description={isChildMode ? "Pedile a tu papá o mamá que te arme una meta." : "Creá la primera meta de ahorro."}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              balance={balanceFor(g.child_id)}
              childName={isChildMode ? undefined : children.find((c) => c.id === g.child_id)?.name}
              canCancel={!isChildMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
