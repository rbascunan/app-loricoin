import type { Bonus, Penalty, Redemption, SavingsGoal, Task } from "./types"

export type NotificationTone = "task" | "done" | "paid" | "rejected" | "penalty" | "prize" | "bonus" | "goal"

export interface AppNotification {
  id: string
  tone: NotificationTone
  title: string
  body: string
  at: string
  amount?: number
}

interface Source {
  isChild: boolean
  nameOf: (childId: string) => string
  tasks: Task[]
  penalties: Penalty[]
  redemptions: Redemption[]
  bonuses: Bonus[]
  goals: SavingsGoal[]
}

const MAX_NOTIFICATIONS = 40

export function buildNotifications(src: Source): AppNotification[] {
  const list: AppNotification[] = []
  const { isChild, nameOf } = src

  for (const t of src.tasks) {
    if (isChild) {
      list.push({ id: `task-new-${t.id}`, tone: "task", title: "Nueva tarea", body: t.title, at: t.created_at, amount: t.reward })
      if (t.status === "pagada")
        list.push({ id: `task-paid-${t.id}`, tone: "paid", title: "¡Tarea aprobada!", body: `Ganaste LoriCoins por "${t.title}"`, at: t.paid_at ?? t.resolved_at ?? t.created_at, amount: t.reward })
      if (t.status === "rechazada")
        list.push({ id: `task-rej-${t.id}`, tone: "rejected", title: "Tarea para revisar", body: t.rejection_note ? `"${t.title}": ${t.rejection_note}` : `"${t.title}" no fue aprobada`, at: t.resolved_at ?? t.created_at })
    } else if (t.done_at && t.status !== "pendiente") {
      list.push({ id: `task-done-${t.id}`, tone: "done", title: `${nameOf(t.child_id)} terminó una tarea`, body: t.status === "terminada" ? `"${t.title}" espera tu aprobación` : t.title, at: t.done_at, amount: t.reward })
    }
  }

  for (const p of src.penalties) {
    list.push({
      id: `pen-${p.id}`,
      tone: "penalty",
      title: isChild ? "Se descontaron LoriCoins" : `Descuento a ${nameOf(p.child_id)}`,
      body: p.reason,
      at: p.created_at,
      amount: -p.amount,
    })
  }

  for (const r of src.redemptions) {
    list.push({
      id: `red-${r.id}-${r.status}`,
      tone: "prize",
      title: isChild ? (r.status === "entregado" ? "Premio entregado" : "¡Canjeaste un premio!") : `${nameOf(r.child_id)} canjeó un premio`,
      body: r.reward_name,
      at: (r.status === "entregado" ? r.delivered_at : r.redeemed_at) ?? r.created_at,
      amount: -r.price,
    })
  }

  for (const b of src.bonuses) {
    list.push({
      id: `bonus-${b.id}`,
      tone: "bonus",
      title: isChild ? "¡Ganaste un premio extra!" : `Premio extra para ${nameOf(b.child_id)}`,
      body: b.reason,
      at: b.created_at,
      amount: b.amount,
    })
  }

  for (const g of src.goals) {
    if (isChild) list.push({ id: `goal-new-${g.id}`, tone: "goal", title: "Nueva meta de ahorro", body: `Ahorrá ${g.target} LoriCoins para: ${g.title}`, at: g.created_at })
    if (g.status === "cumplida")
      list.push({ id: `goal-ok-${g.id}`, tone: "goal", title: isChild ? "¡Cumpliste tu meta!" : `${nameOf(g.child_id)} cumplió su meta`, body: g.title, at: g.completed_at ?? g.created_at, amount: g.bonus })
  }

  return list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, MAX_NOTIFICATIONS)
}

export function countUnread(list: AppNotification[], seenAt: string | null): number {
  if (!seenAt) return list.length
  const seen = Date.parse(seenAt)
  return list.filter((n) => Date.parse(n.at) > seen).length
}
