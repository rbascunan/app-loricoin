import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { ACTIVE_TASK_STATUSES } from "@/lib/loricoin/rules"
import type { ChildSummary, Penalty, Profile, Redemption, Reward, Task } from "@/lib/loricoin/types"
import { createChildWallet } from "@/lib/solana"
import { decryptSecret, encryptSecret } from "./wallet-crypto"
import type { TaskRepo } from "./task-service"
import type { StoreRepo } from "./store-service"

const REWARD_COLUMNS = "id, name, description, category, price, stock, image_url"
const REDEMPTION_COLUMNS =
  "id, reward_id, child_id, reward_name, reward_image, price, status, tx_signature, created_at, redeemed_at, delivered_at"

const PROFILE_COLUMNS = "id, name, role, parent_id, username, lori_coins, wallet_address"
const PENALTY_COLUMNS = "id, parent_id, child_id, reason, amount, created_at, tx_signature"
const TASK_COLUMNS =
  "id, parent_id, child_id, title, description, reward, status, rejection_note, created_at, done_at, resolved_at, tx_signature, paid_at, error_message, payment_started_at, payment_last_valid_height"

type ProfileRow = Omit<Profile, "lori_coins"> & { lori_coins: number | null }
type TaskRow = Omit<Task, "payment_last_valid_height"> & { payment_last_valid_height: number | string | null }

const toProfile = (row: ProfileRow): Profile => ({ ...row, lori_coins: row.lori_coins ?? 0 })
const toTask = (row: TaskRow): Task => ({
  ...row,
  payment_last_valid_height: row.payment_last_valid_height === null ? null : Number(row.payment_last_valid_height),
})

export function createSupabaseRepo() {
  const db = createAdminClient()

  const repo: TaskRepo &
    StoreRepo & {
    listRewards(): Promise<Reward[]>
    listRedemptions(field: "parent_id" | "child_id", id: string): Promise<Redemption[]>
    listChildren(parentId: string): Promise<ChildSummary[]>
    listTasks(field: "parent_id" | "child_id", id: string): Promise<Task[]>
    listPenalties(field: "parent_id" | "child_id", id: string): Promise<Penalty[]>
    setCachedBalance(childId: string, amount: number): Promise<void>
  } = {
    async getProfile(id) {
      const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle()
      if (error) throw error
      return data ? toProfile(data as ProfileRow) : null
    },

    async findProfileByUsername(username) {
      const { data, error } = await db
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("username", username)
        .maybeSingle()
      if (error) throw error
      return data ? toProfile(data as ProfileRow) : null
    },

    async createChildAccount({ email, pin, name, username, parentId }) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
        user_metadata: { name },
        app_metadata: { role: "child", parent_id: parentId, username },
      })
      if (error || !data.user) {
        if (error?.code === "email_exists" || /already/i.test(error?.message ?? "")) {
          return { ok: false, reason: "exists" }
        }
        if (error?.code === "weak_password") return { ok: false, reason: "weak_pin" }
        console.error("[children] createUser failed", error?.code, error?.message)
        return { ok: false, reason: "error" }
      }

      const id = data.user.id
      const { error: profileError } = await db
        .from("profiles")
        .upsert({ id, name, role: "child", parent_id: parentId, username }, { onConflict: "id" })
      if (profileError) {
        await db.auth.admin.deleteUser(id)
        console.error("[children] profile upsert failed", profileError.code, profileError.message)
        return { ok: false, reason: profileError.code === "23505" ? "exists" : "error" }
      }

      // Si la wallet falla, se crea sola en el primer uso: la cuenta del hijo no depende de esto.
      await repo.getChildWalletAddress(id).catch((walletError) =>
        console.error("[children] wallet creation deferred", (walletError as Error)?.message),
      )
      return { ok: true, id }
    },

    async getChildWalletAddress(childId) {
      const { data: existing, error } = await db
        .from("child_wallet_secrets")
        .select("public_key")
        .eq("child_id", childId)
        .maybeSingle()
      if (error) throw error
      if (existing) return existing.public_key as string

      const wallet = createChildWallet()
      const encrypted = encryptSecret(wallet.secretKey)
      const { error: insertError } = await db
        .from("child_wallet_secrets")
        .insert({ child_id: childId, public_key: wallet.publicKey, ...encrypted })
      if (insertError) {
        // Otra solicitud la creó al mismo tiempo: usamos la que quedó guardada.
        if (insertError.code === "23505") return repo.getChildWalletAddress(childId)
        throw insertError
      }
      const { error: profileError } = await db
        .from("profiles")
        .update({ wallet_address: wallet.publicKey })
        .eq("id", childId)
      if (profileError) throw profileError
      return wallet.publicKey
    },

    async getChildWalletSecret(childId) {
      const { data, error } = await db
        .from("child_wallet_secrets")
        .select("ciphertext, iv, auth_tag")
        .eq("child_id", childId)
        .single()
      if (error) throw error
      return decryptSecret(data as { ciphertext: string; iv: string; auth_tag: string })
    },

    async claimTaskPayment(taskId, parentId, dailyLimit) {
      const { data, error } = await db.rpc("claim_task_payment", {
        p_task: taskId,
        p_parent: parentId,
        p_daily_limit: dailyLimit,
      })
      if (error) throw error
      return data as "ok" | "not_claimable" | "daily_limit"
    },

    async savePendingSignature(taskId, signature, lastValidBlockHeight) {
      const { error } = await db
        .from("tasks")
        .update({ tx_signature: signature, payment_last_valid_height: lastValidBlockHeight })
        .eq("id", taskId)
        .eq("status", "pagando")
      if (error) throw error
    },

    async recordPenalty({ parentId, childId, reason, amount, signature }) {
      const { data, error } = await db.rpc("apply_penalty", {
        p_parent: parentId,
        p_child: childId,
        p_reason: reason,
        p_amount: amount,
        p_signature: signature,
      })
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as { id: string; balance: number }
      return { id: row.id, balance: row.balance }
    },

    async setCachedBalance(childId, amount) {
      const { error } = await db.from("profiles").update({ lori_coins: amount }).eq("id", childId)
      if (error) throw error
    },

    async countActiveTasks(childId) {
      const { count, error } = await db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("child_id", childId)
        .in("status", ACTIVE_TASK_STATUSES)
      if (error) throw error
      return count ?? 0
    },

    async insertTask(task) {
      const { data, error } = await db.from("tasks").insert(task).select(TASK_COLUMNS).single()
      if (error) throw error
      return toTask(data as TaskRow)
    },

    async getTask(id) {
      const { data, error } = await db.from("tasks").select(TASK_COLUMNS).eq("id", id).maybeSingle()
      if (error) throw error
      return data ? toTask(data as TaskRow) : null
    },

    async transitionTask(id, from, patch) {
      const { data, error } = await db
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .eq("status", from)
        .select(TASK_COLUMNS)
        .maybeSingle()
      if (error) throw error
      return data ? toTask(data as TaskRow) : null
    },

    async addLoriCoins(childId, amount) {
      const { data, error } = await db.rpc("add_lori_coins", { p_user: childId, p_amount: amount })
      if (error) throw error
      return data as number
    },

    async listChildren(parentId) {
      const { data, error } = await db
        .from("profiles")
        .select("id, name, username, lori_coins, wallet_address")
        .eq("parent_id", parentId)
        .eq("role", "child")
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []).map((c) => ({ ...c, lori_coins: c.lori_coins ?? 0 })) as ChildSummary[]
    },

    async listPenalties(field, id) {
      const { data, error } = await db
        .from("penalties")
        .select(PENALTY_COLUMNS)
        .eq(field, id)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as Penalty[]
    },

    async listRewards() {
      const { data, error } = await db
        .from("rewards")
        .select(REWARD_COLUMNS)
        .eq("active", true)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return (data ?? []) as Reward[]
    },

    async getReward(id) {
      const { data, error } = await db.from("rewards").select(REWARD_COLUMNS).eq("id", id).eq("active", true).maybeSingle()
      if (error) throw error
      return (data as Reward | null) ?? null
    },

    async reserveReward(childId, rewardId) {
      const { data, error } = await db.rpc("reserve_reward", { p_child: childId, p_reward: rewardId })
      if (error) {
        if (error.code === "23505" || error.message.includes("busy")) return { ok: false, reason: "busy" }
        if (error.message.includes("out_of_stock")) return { ok: false, reason: "out_of_stock" }
        if (error.message.includes("not_found")) return { ok: false, reason: "not_found" }
        if (error.message.includes("not_child")) return { ok: false, reason: "not_child" }
        throw error
      }
      const row = (Array.isArray(data) ? data[0] : data) as { redemption_id: string; price: number }
      return { ok: true, redemptionId: row.redemption_id, price: row.price }
    },

    async confirmRedemption(redemptionId, signature) {
      const { error } = await db.rpc("confirm_redemption", { p_redemption: redemptionId, p_signature: signature })
      if (error) throw error
    },

    async cancelRedemption(redemptionId) {
      const { error } = await db.rpc("cancel_redemption", { p_redemption: redemptionId })
      if (error) console.error("[store] cancel failed", error.code, error.message)
    },

    async markRedemptionDelivered(redemptionId, parentId) {
      const { data, error } = await db
        .from("reward_redemptions")
        .update({ status: "entregado", delivered_at: new Date().toISOString() })
        .eq("id", redemptionId)
        .eq("parent_id", parentId)
        .eq("status", "canjeado")
        .select("id")
        .maybeSingle()
      if (error) throw error
      return data !== null
    },

    async listRedemptions(field, id) {
      const { data, error } = await db
        .from("reward_redemptions")
        .select(REDEMPTION_COLUMNS)
        .eq(field, id)
        .in("status", ["canjeado", "entregado"])
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as Redemption[]
    },

    async listTasks(field, id) {
      const { data, error } = await db
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq(field, id)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return ((data ?? []) as TaskRow[]).map(toTask)
    },
  }

  return repo
}
