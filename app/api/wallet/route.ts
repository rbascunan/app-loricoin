import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, jsonError, unauthorized } from "@/lib/server/http"
import { getLoricoinBalance } from "@/lib/solana"
import type { WalletBalance, WalletResponse } from "@/lib/loricoin/types"

/** Saldo on-chain (fuente de verdad). Si Solana no responde, devuelve la caché de la base. */
export async function GET() {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const me = await repo.getProfile(userId)
    if (!me) return jsonError(404, "No encontramos tu perfil")

    const kids =
      me.role === "child"
        ? [{ id: me.id, lori_coins: me.lori_coins }]
        : (await repo.listChildren(me.id)).map((c) => ({ id: c.id, lori_coins: c.lori_coins }))

    const balances: WalletBalance[] = await Promise.all(
      kids.map(async (kid) => {
        let address: string | null = null
        try {
          address = await repo.getChildWalletAddress(kid.id)
          const amount = await getLoricoinBalance(address)
          if (amount !== kid.lori_coins) {
            await repo.setCachedBalance(kid.id, amount).catch(() => undefined)
          }
          return { childId: kid.id, address, amount, source: "chain" as const }
        } catch (error) {
          console.error("[wallet] on-chain balance failed", (error as Error)?.message)
          return { childId: kid.id, address, amount: kid.lori_coins, source: "cache" as const }
        }
      }),
    )

    const body: WalletResponse = {
      mint: process.env.LORICOIN_MINT_ADDRESS ?? null,
      balances,
      chainOk: balances.every((b) => b.source === "chain"),
    }
    return Response.json(body, { headers: { "Cache-Control": "no-store" } })
  })
}
