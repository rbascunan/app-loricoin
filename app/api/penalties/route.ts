import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, jsonError, readJson, unauthorized } from "@/lib/server/http"
import { PENALTY_LIMITS } from "@/lib/loricoin/rules"

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const me = await repo.getProfile(userId)
    if (!me || me.role !== "parent") return jsonError(403, "Solo un padre o madre puede descontar LoriCoins")

    const body = (await readJson(req)) as { childId?: unknown; reason?: unknown; amount?: unknown } | null
    const childId = typeof body?.childId === "string" ? body.childId : ""
    const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
    const amount = Number(body?.amount)

    if (!childId) return jsonError(400, "Elegí a quién descontar")
    if (reason.length < 1 || reason.length > PENALTY_LIMITS.reason) {
      return jsonError(400, `El motivo tiene que tener entre 1 y ${PENALTY_LIMITS.reason} caracteres`)
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > PENALTY_LIMITS.maxAmount) {
      return jsonError(400, `El descuento tiene que ser un número entero entre 1 y ${PENALTY_LIMITS.maxAmount}`)
    }

    const result = await repo.applyPenalty(userId, childId, reason, amount)
    if (!result.ok) {
      return result.reason === "not_found"
        ? jsonError(404, "No encontramos a ese hijo en tu familia")
        : jsonError(409, "No tiene LoriCoins para descontar")
    }
    return Response.json(
      { amount: result.amount, balance: result.balance },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    )
  })
}
