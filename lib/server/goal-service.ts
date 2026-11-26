import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { GOAL_LIMITS } from "@/lib/loricoin/goals"
import { isUuid, requiredText } from "@/lib/loricoin/rules"
import type { SavingsGoal } from "@/lib/loricoin/types"
import { createSupabaseRepo } from "./supabase-repo"
import type { ServiceResult } from "./task-service"

const fail = (status: number, error: string): ServiceResult<never> => ({ ok: false, status, error })
const asRecord = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {}
const intInRange = (value: unknown, min: number, max: number) => {
  const n = typeof value === "string" ? Number(value) : value
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max ? n : null
}

export async function createGoal(parentId: string, input: unknown): Promise<ServiceResult<SavingsGoal>> {
  const body = asRecord(input)
  const repo = createSupabaseRepo()
  const parent = await repo.getProfile(parentId)
  if (parent?.role !== "parent") return fail(403, "Solo un padre o una madre puede crear metas")

  if (!isUuid(body.childId)) return fail(400, "Elegí a qué hijo le asignás la meta")
  const child = await repo.getProfile(body.childId)
  if (!child || child.role !== "child" || child.parent_id !== parentId) return fail(404, "No encontramos a ese hijo")

  const title = requiredText(body.title, GOAL_LIMITS.title)
  if (!title) return fail(400, "Escribí para qué es la meta")
  const target = intInRange(body.target, GOAL_LIMITS.minTarget, GOAL_LIMITS.maxTarget)
  if (target === null) return fail(400, `La meta tiene que ser entre ${GOAL_LIMITS.minTarget} y ${GOAL_LIMITS.maxTarget} LoriCoins`)
  const bonus = intInRange(body.bonus, GOAL_LIMITS.minBonus, GOAL_LIMITS.maxBonus)
  if (bonus === null) return fail(400, `El premio tiene que ser entre ${GOAL_LIMITS.minBonus} y ${GOAL_LIMITS.maxBonus} LoriCoins`)
  const months = intInRange(body.months, GOAL_LIMITS.minMonths, GOAL_LIMITS.maxMonths)
  if (months === null) return fail(400, `El plazo tiene que ser entre ${GOAL_LIMITS.minMonths} y ${GOAL_LIMITS.maxMonths} meses`)
  const rewardId = body.rewardId ? (isUuid(body.rewardId) ? body.rewardId : null) : null
  if (body.rewardId && !rewardId) return fail(400, "Ese premio de la tienda no es válido")

  const db = createAdminClient()
  const { count } = await db
    .from("savings_goals")
    .select("id", { count: "exact", head: true })
    .eq("child_id", child.id)
    .eq("status", "activa")
  if ((count ?? 0) >= GOAL_LIMITS.maxActivePerChild)
    return fail(409, `Cada hijo puede tener hasta ${GOAL_LIMITS.maxActivePerChild} metas activas`)

  const endsAt = new Date()
  endsAt.setMonth(endsAt.getMonth() + months)

  const { data, error } = await db
    .from("savings_goals")
    .insert({
      parent_id: parentId,
      child_id: child.id,
      title,
      target,
      bonus,
      reward_id: rewardId,
      start_balance: child.lori_coins,
      ends_at: endsAt.toISOString(),
    })
    .select("*")
    .single()
  if (error) throw error
  return { ok: true, data: data as SavingsGoal }
}

export async function cancelGoal(parentId: string, goalId: string): Promise<ServiceResult<{ id: string }>> {
  if (!isUuid(goalId)) return fail(404, "No encontramos esa meta")
  const { data } = await createAdminClient()
    .from("savings_goals")
    .update({ status: "cancelada" })
    .eq("id", goalId)
    .eq("parent_id", parentId)
    .eq("status", "activa")
    .select("id")
    .maybeSingle()
  if (!data) return fail(404, "No encontramos una meta activa con ese id")
  return { ok: true, data: { id: data.id as string } }
}
