import { after } from "next/server"
import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { evaluateGoals, listBonuses, listGoals, payPendingBonuses, settlePreviousWeek } from "@/lib/server/rewards-engine"
import { getSessionUserId, handle, jsonError, unauthorized } from "@/lib/server/http"
import type { MeResponse } from "@/lib/loricoin/types"

export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const profile = await repo.getProfile(userId)
    if (!profile) return jsonError(404, "No encontramos tu perfil")

    await settlePreviousWeek()

    const field = profile.role === "parent" ? "parent_id" : "child_id"
    const [children, tasks, penalties, redemptions, initialGoals] = await Promise.all([
      profile.role === "parent" ? repo.listChildren(profile.id) : Promise.resolve([]),
      repo.listTasks(field, profile.id),
      repo.listPenalties(field, profile.id),
      repo.listRedemptions(field, profile.id),
      listGoals(field, profile.id),
    ])

    const balanceOf = (childId: string) =>
      childId === profile.id ? profile.lori_coins : (children.find((c) => c.id === childId)?.lori_coins ?? 0)
    const goalsChanged = await evaluateGoals(initialGoals, balanceOf)
    const [goals, bonuses] = await Promise.all([
      goalsChanged ? listGoals(field, profile.id) : Promise.resolve(initialGoals),
      listBonuses(field, profile.id),
    ])

    const childIds = profile.role === "parent" ? children.map((c) => c.id) : [profile.id]
    if (bonuses.some((b) => b.status !== "pagada") || goalsChanged) {
      after(() => payPendingBonuses(childIds))
    }

    const body: MeResponse = { profile, children, tasks, penalties, redemptions, bonuses, goals }
    return Response.json(body, { headers: { "Cache-Control": "no-store" } })
  })
}
