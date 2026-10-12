import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { createChild } from "@/lib/server/task-service"
import { getSessionUserId, handle, readJson, respond, unauthorized } from "@/lib/server/http"

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    return respond(await createChild(createSupabaseRepo(), userId, await readJson(req)), 201)
  })
}
