import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, jsonError, unauthorized } from "@/lib/server/http"
import type { MeResponse } from "@/lib/loricoin/types"

export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const profile = await repo.getProfile(userId)
    if (!profile) return jsonError(404, "No encontramos tu perfil")

    const field = profile.role === "parent" ? "parent_id" : "child_id"
    const [children, tasks, penalties] = await Promise.all([
      profile.role === "parent" ? repo.listChildren(profile.id) : Promise.resolve([]),
      repo.listTasks(field, profile.id),
      repo.listPenalties(field, profile.id),
    ])

    const body: MeResponse = { profile, children, tasks, penalties }
    return Response.json(body, { headers: { "Cache-Control": "no-store" } })
  })
}
