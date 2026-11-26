import { cancelGoal } from "@/lib/server/goal-service"
import { getSessionUserId, handle, respond, unauthorized } from "@/lib/server/http"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const { id } = await params
    return respond(await cancelGoal(userId, id))
  })
}
