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

    const [children, tasks] =
      profile.role === "parent"
        ? await Promise.all([repo.listChildren(profile.id), repo.listTasks("parent_id", profile.id)])
        : [[], await repo.listTasks("child_id", profile.id)]

    const body: MeResponse = { profile, children, tasks }
    return Response.json(body, { headers: { "Cache-Control": "no-store" } })
  })
}
