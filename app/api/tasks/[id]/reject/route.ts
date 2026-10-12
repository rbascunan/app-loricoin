import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { rejectTask } from "@/lib/server/task-service"
import { getSessionUserId, handle, readJson, respond, unauthorized } from "@/lib/server/http"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const { id } = await params
    return respond(await rejectTask(createSupabaseRepo(), userId, id, await readJson(req)))
  })
}
