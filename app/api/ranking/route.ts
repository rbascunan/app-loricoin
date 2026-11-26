import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getRanking } from "@/lib/server/rewards-engine"
import { getSessionUserId, handle, jsonError, unauthorized } from "@/lib/server/http"

export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const profile = await repo.getProfile(userId)
    if (!profile) return jsonError(404, "No encontramos tu perfil")

    const viewerIds =
      profile.role === "parent" ? (await repo.listChildren(profile.id)).map((c) => c.id) : [profile.id]
    const ranking = await getRanking(viewerIds)
    return Response.json(ranking, { headers: { "Cache-Control": "no-store" } })
  })
}
