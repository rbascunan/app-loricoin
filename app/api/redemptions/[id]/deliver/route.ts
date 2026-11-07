import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { markDelivered } from "@/lib/server/store-service"
import { getSessionUserId, handle, respond, unauthorized } from "@/lib/server/http"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const { id } = await params
    return respond(await markDelivered(createSupabaseRepo(), userId, id))
  })
}
