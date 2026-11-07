import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { solanaPort } from "@/lib/server/solana-port"
import { redeemReward } from "@/lib/server/store-service"
import { getSessionUserId, handle, readJson, respond, unauthorized } from "@/lib/server/http"

export const maxDuration = 60

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    return respond(await redeemReward(createSupabaseRepo(), userId, await readJson(req), solanaPort), 201)
  })
}
