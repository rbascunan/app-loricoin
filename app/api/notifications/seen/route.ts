import { createAdminClient } from "@/lib/supabase/admin"
import { getSessionUserId, handle, unauthorized } from "@/lib/server/http"

export async function POST() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const seenAt = new Date().toISOString()
    const { error } = await createAdminClient().from("profiles").update({ notifications_seen_at: seenAt }).eq("id", userId)
    if (error) throw error
    return Response.json({ seenAt })
  })
}
