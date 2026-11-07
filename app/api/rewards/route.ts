import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, unauthorized } from "@/lib/server/http"

export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const rewards = await createSupabaseRepo().listRewards()
    return Response.json({ rewards }, { headers: { "Cache-Control": "no-store" } })
  })
}
