import type { Profile, Redemption, Reward } from "@/lib/loricoin/types"
import { MIN_AUTHORITY_SOL_TO_PAY, isUuid } from "@/lib/loricoin/rules"
import { PaymentPendingError } from "./payment-errors"
import type { ServiceResult, SolanaPort } from "./task-service"

export type ReserveResult =
  | { ok: true; redemptionId: string; price: number }
  | { ok: false; reason: "out_of_stock" | "not_found" | "busy" | "not_child" }

export interface StoreRepo {
  getProfile(id: string): Promise<Profile | null>
  getChildWalletAddress(childId: string): Promise<string>
  getChildWalletSecret(childId: string): Promise<Uint8Array>
  getReward(id: string): Promise<Reward | null>
  reserveReward(childId: string, rewardId: string): Promise<ReserveResult>
  confirmRedemption(redemptionId: string, signature: string): Promise<void>
  cancelRedemption(redemptionId: string): Promise<void>
  markRedemptionDelivered(redemptionId: string, parentId: string): Promise<boolean>
}

const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
const fail = (status: number, error: string): ServiceResult<never> => ({ ok: false, status, error })

const SOLANA_UNAVAILABLE = "No pudimos conectar con Solana. Probá de nuevo en un momento."

export async function redeemReward(
  repo: StoreRepo,
  actorId: string,
  input: unknown,
  solana: SolanaPort,
): Promise<ServiceResult<{ redemptionId: string; rewardName: string; price: number; balance: number; signature: string }>> {
  const child = await repo.getProfile(actorId)
  if (!child || child.role !== "child") return fail(403, "Solo los chicos pueden canjear sus LoriCoins")

  const rewardId = (input as { rewardId?: unknown } | null)?.rewardId
  if (!isUuid(rewardId)) return fail(400, "Elegí un premio")

  const reward = await repo.getReward(rewardId)
  if (!reward) return fail(404, "Ese premio ya no está disponible")
  if (reward.stock < 1) return fail(409, "Este premio se agotó")

  let balance: number
  try {
    if ((await solana.authoritySol()) < MIN_AUTHORITY_SOL_TO_PAY) {
      return fail(503, "La tienda no puede procesar canjes ahora. Avisale a un adulto.")
    }
    balance = await solana.balance(await repo.getChildWalletAddress(child.id))
  } catch {
    return fail(503, SOLANA_UNAVAILABLE)
  }
  if (balance < reward.price) {
    return fail(409, `Te faltan ${reward.price - balance} LoriCoins para este premio. ¡Seguí ahorrando!`)
  }

  // La reserva descuenta el stock de forma atómica: si dos chicos canjean el último, solo uno lo consigue.
  const reserved = await repo.reserveReward(child.id, reward.id)
  if (!reserved.ok) {
    if (reserved.reason === "out_of_stock") return fail(409, "Este premio se agotó")
    if (reserved.reason === "busy") return fail(409, "Ya estás canjeando otro premio. Esperá unos segundos.")
    return fail(404, "Ese premio ya no está disponible")
  }

  let signature: string
  try {
    signature = await solana.burn(await repo.getChildWalletSecret(child.id), reserved.price)
  } catch (error) {
    if (error instanceof PaymentPendingError) {
      return fail(504, "Solana está tardando en confirmar el canje. Revisá tus movimientos en unos minutos.")
    }
    console.error("[store] burn failed", (error as Error)?.message)
    await repo.cancelRedemption(reserved.redemptionId)
    return fail(502, "No se pudo completar el canje. Tus LoriCoins siguen en tu billetera; probá de nuevo.")
  }

  await repo.confirmRedemption(reserved.redemptionId, signature)
  return ok({
    redemptionId: reserved.redemptionId,
    rewardName: reward.name,
    price: reserved.price,
    balance: balance - reserved.price,
    signature,
  })
}

export async function markDelivered(
  repo: StoreRepo,
  actorId: string,
  redemptionId: string,
): Promise<ServiceResult<{ id: string }>> {
  const parent = await repo.getProfile(actorId)
  if (!parent || parent.role !== "parent") return fail(403, "Solo un padre o una madre puede marcar la entrega")
  if (!isUuid(redemptionId)) return fail(404, "No encontramos ese canje")
  const updated = await repo.markRedemptionDelivered(redemptionId, parent.id)
  return updated ? ok({ id: redemptionId }) : fail(409, "Ese canje ya fue entregado o no es de tu familia")
}

export type { Redemption }
