import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { GOAL_LIMITS, RANKING_PRIZE, weekStartAR } from "@/lib/loricoin/goals"
import type { Bonus, RankingResponse, SavingsGoal } from "@/lib/loricoin/types"
import { createSupabaseRepo } from "./supabase-repo"
import { solanaPort } from "./solana-port"

const BONUS_COLUMNS =
  "id, child_id, parent_id, kind, amount, reason, week_start, goal_id, status, tx_signature, created_at, paid_at"
const GOAL_COLUMNS =
  "id, parent_id, child_id, title, target, bonus, reward_id, start_balance, starts_at, ends_at, status, created_at, completed_at"
const STALE_BONUS_MS = 5 * 60 * 1000

const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function listBonuses(field: "parent_id" | "child_id", id: string): Promise<Bonus[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from("bonuses")
    .select(BONUS_COLUMNS)
    .eq(field, id)
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as Bonus[]
}

export async function listGoals(field: "parent_id" | "child_id", id: string): Promise<SavingsGoal[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from("savings_goals")
    .select(GOAL_COLUMNS)
    .eq(field, id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as SavingsGoal[]
}

/** Cierra la semana anterior (idempotente: el índice único evita premiar dos veces la misma semana). */
export async function settlePreviousWeek(): Promise<void> {
  const db = createAdminClient()
  const previous = addDays(weekStartAR(), -7)
  const { error } = await db.rpc("settle_weekly_ranking", { p_week_start: previous })
  if (error) console.error("[ranking] settle failed", error.code, error.message)
}

/** Marca metas cumplidas o vencidas según el saldo actual del hijo y crea el bono de cada meta cumplida. */
export async function evaluateGoals(goals: SavingsGoal[], balanceOf: (childId: string) => number): Promise<boolean> {
  const db = createAdminClient()
  let changed = false
  const now = Date.now()
  for (const goal of goals.filter((g) => g.status === "activa")) {
    const progress = balanceOf(goal.child_id) - goal.start_balance
    if (progress >= goal.target) {
      const { data } = await db
        .from("savings_goals")
        .update({ status: "cumplida", completed_at: new Date().toISOString() })
        .eq("id", goal.id)
        .eq("status", "activa")
        .select("id")
        .maybeSingle()
      if (data) {
        changed = true
        const { error } = await db.from("bonuses").insert({
          child_id: goal.child_id,
          parent_id: goal.parent_id,
          kind: "meta",
          amount: goal.bonus,
          reason: `Meta de ahorro cumplida: ${goal.title}`,
          goal_id: goal.id,
        })
        if (error && error.code !== "23505") console.error("[goals] bonus insert failed", error.message)
      }
    } else if (Date.parse(goal.ends_at) < now) {
      const { data } = await db
        .from("savings_goals")
        .update({ status: "vencida" })
        .eq("id", goal.id)
        .eq("status", "activa")
        .select("id")
        .maybeSingle()
      if (data) changed = true
    }
  }
  return changed
}

/** Emite en Solana los bonos pendientes de estos hijos. Cada bono se reserva con un UPDATE condicional. */
export async function payPendingBonuses(childIds: string[]): Promise<void> {
  if (childIds.length === 0) return
  const db = createAdminClient()
  const repo = createSupabaseRepo()

  const staleBefore = new Date(Date.now() - STALE_BONUS_MS).toISOString()
  await db
    .from("bonuses")
    .update({ status: "pendiente" })
    .in("child_id", childIds)
    .eq("status", "pagando")
    .is("tx_signature", null)
    .lt("created_at", staleBefore)

  const { data: pending } = await db
    .from("bonuses")
    .select(BONUS_COLUMNS)
    .in("child_id", childIds)
    .eq("status", "pendiente")
    .limit(10)

  for (const bonus of (pending ?? []) as Bonus[]) {
    const { data: claimed } = await db
      .from("bonuses")
      .update({ status: "pagando" })
      .eq("id", bonus.id)
      .eq("status", "pendiente")
      .select("id")
      .maybeSingle()
    if (!claimed) continue

    try {
      const address = await repo.getChildWalletAddress(bonus.child_id)
      const signature = await solanaPort.mint(address, bonus.amount, async (sig) => {
        await db.from("bonuses").update({ tx_signature: sig }).eq("id", bonus.id)
      })
      await db
        .from("bonuses")
        .update({ status: "pagada", tx_signature: signature, paid_at: new Date().toISOString() })
        .eq("id", bonus.id)
      await repo.addLoriCoins(bonus.child_id, bonus.amount).catch(() => undefined)
    } catch (error) {
      console.error("[bonuses] mint failed", bonus.id, (error as Error)?.message)
      await db.from("bonuses").update({ status: "pendiente", tx_signature: null }).eq("id", bonus.id).eq("status", "pagando")
    }
  }
}

export async function getRanking(viewerIds: string[]): Promise<RankingResponse> {
  const db = createAdminClient()
  const weekStart = weekStartAR()
  const previous = addDays(weekStart, -7)
  const [{ data: rows, error }, { data: winners }] = await Promise.all([
    db.rpc("weekly_savings", { p_week_start: weekStart }),
    db.from("bonuses").select("child_id, created_at").eq("kind", "ranking").eq("week_start", previous).order("created_at"),
  ])
  if (error) throw error

  const entries = ((rows ?? []) as { child_id: string; name: string; avatar: string | null; saved: number }[]).map((r) => ({
    childId: r.child_id,
    name: r.name.split(" ")[0] ?? r.name,
    avatar: r.avatar,
    saved: r.saved,
    isMe: viewerIds.includes(r.child_id),
  }))

  const winnerIds = (winners ?? []).map((w) => w.child_id as string)
  const { data: winnerProfiles } = winnerIds.length
    ? await db.from("profiles").select("id, name, avatar").in("id", winnerIds)
    : { data: [] }
  const lastWinners = winnerIds
    .map((id) => (winnerProfiles ?? []).find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({
      childId: p!.id as string,
      name: ((p!.name as string).split(" ")[0] ?? p!.name) as string,
      avatar: (p!.avatar as string | null) ?? null,
      isMe: viewerIds.includes(p!.id as string),
    }))

  return { weekStart, weekEnd: addDays(weekStart, 6), entries, lastWinners }
}

export { GOAL_LIMITS, RANKING_PRIZE }
