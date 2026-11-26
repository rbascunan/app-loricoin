import { createGoal } from "@/lib/server/goal-service"
import { getSessionUserId, handle, readJson, respond, unauthorized } from "@/lib/server/http"

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    return respond(await createGoal(userId, await readJson(req)), 201)
  })
}
