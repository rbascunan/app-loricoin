import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { ACTIVE_TASK_STATUSES } from "@/lib/loricoin/rules"
import type { ChildSummary, Penalty, Profile, Task } from "@/lib/loricoin/types"
import { createChildWallet } from "@/lib/solana"
import { decryptSecret, encryptSecret } from "./wallet-crypto"
import type { TaskRepo } from "./task-service"

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

  const repo: TaskRepo & {
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
