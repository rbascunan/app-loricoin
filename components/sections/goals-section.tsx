"use client"

import { useState } from "react"
import { Loader2, Pencil, Plus, Target, Trash2 } from "lucide-react"
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

const MONTH_OPTIONS = [1, 2, 3, 6, 9, 12]

function goalMonths(goal: SavingsGoal) {
  const start = new Date(goal.starts_at)
  const end = new Date(goal.ends_at)
  const diff = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
  return Math.min(GOAL_LIMITS.maxMonths, Math.max(GOAL_LIMITS.minMonths, diff))
}

function GoalForm({ goal, onDone }: { goal?: SavingsGoal; onDone: () => void }) {
  const { children, refresh } = useApp()
  const isEdit = Boolean(goal)
  const [childId, setChildId] = useState(goal?.child_id ?? children[0]?.id ?? "")
  const [title, setTitle] = useState(goal?.title ?? "")
  const [target, setTarget] = useState(String(goal?.target ?? 200))
  const [bonus, setBonus] = useState(String(goal?.bonus ?? 20))
  const [months, setMonths] = useState(String(goal ? goalMonths(goal) : 3))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const monthOptions = Array.from(new Set([...MONTH_OPTIONS, Number(months)])).sort((a, b) => a - b)
  const fallbackError = isEdit ? "No pudimos guardar los cambios" : "No pudimos crear la meta"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(isEdit ? `/api/goals/${goal!.id}` : "/api/goals", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          title,
          target: Number(target),
          bonus: Number(bonus),
          months: Number(months),
          rewardId: goal?.reward_id ?? undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? fallbackError)
      await refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError)
    } finally {
      setSaving(false)
    }
  }

  const fieldId = (name: string) => `goal-${goal?.id ?? "new"}-${name}`

  return (
    <Card className={cn(isEdit && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-2", isEdit && "px-0 pt-0")}>
        <CardTitle className="text-lg">{isEdit ? "Editar meta" : "Nueva meta de ahorro"}</CardTitle>
      </CardHeader>
      <CardContent className={cn(isEdit && "px-0 pb-0")}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("child")}>Hijo o hija</Label>
            <Select value={childId} onValueChange={setChildId} disabled={isEdit}>
              <SelectTrigger id={fieldId("child")}>
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
            <Label htmlFor={fieldId("title")}>¿Para qué ahorra?</Label>
            <Input
              id={fieldId("title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={GOAL_LIMITS.title}
              placeholder="Ej: un drone de la tienda, una salida al cine"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("target")}>LoriCoins a ahorrar</Label>
            <Input
              id={fieldId("target")}
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
            <Label htmlFor={fieldId("months")}>Plazo</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger id={fieldId("months")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} {m === 1 ? "mes" : "meses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("bonus")}>Premio extra si la cumple</Label>
            <Input
              id={fieldId("bonus")}
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
              {isEdit ? "Guardar cambios" : "Crear meta"}
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
  const [editing, setEditing] = useState(false)
  const saved = goal.status === "cumplida" ? goal.target : Math.max(0, balance - goal.start_balance)
  const percent = goalProgress(saved, goal.target)
  const status = STATUS_LABEL[goal.status]

  const cancel = async () => {
    setBusy(true)
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" })
    await refresh()
    setBusy(false)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4">
          <GoalForm goal={goal} onDone={() => setEditing(false)} />
        </CardContent>
      </Card>
    )
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
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800" onClick={() => setEditing(true)} disabled={busy}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-800" onClick={cancel} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Cancelar meta
            </Button>
          </div>
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
