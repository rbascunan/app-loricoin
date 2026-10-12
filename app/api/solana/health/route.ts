import { getSessionUserId, handle, unauthorized } from "@/lib/server/http"
import { checkSolanaHealth } from "@/lib/solana"

export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const health = await checkSolanaHealth()
    return Response.json(health, { status: health.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } })
  })
}
