import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { ACTIVE_TASK_STATUSES } from "@/lib/loricoin/rules"
import type { ChildSummary, Profile, Task } from "@/lib/loricoin/types"
import type { TaskRepo } from "./task-service"

const PROFILE_COLUMNS = "id, name, role, parent_id, username, lori_coins"
const TASK_COLUMNS =
  "id, parent_id, child_id, title, description, reward, status, rejection_note, created_at, done_at, resolved_at"

type ProfileRow = Omit<Profile, "lori_coins"> & { lori_coins: number | null }

const toProfile = (row: ProfileRow): Profile => ({ ...row, lori_coins: row.lori_coins ?? 0 })

export function createSupabaseRepo() {
  const db = createAdminClient()

  const repo: TaskRepo & {
    listChildren(parentId: string): Promise<ChildSummary[]>
    listTasks(field: "parent_id" | "child_id", id: string): Promise<Task[]>
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
      return { ok: true, id }
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
      return data as Task
    },

    async getTask(id) {
      const { data, error } = await db.from("tasks").select(TASK_COLUMNS).eq("id", id).maybeSingle()
      if (error) throw error
      return (data as Task | null) ?? null
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
      return (data as Task | null) ?? null
    },

    async addLoriCoins(childId, amount) {
      const { data, error } = await db.rpc("add_lori_coins", { p_user: childId, p_amount: amount })
      if (error) throw error
      return data as number
    },

    async listChildren(parentId) {
      const { data, error } = await db
        .from("profiles")
        .select("id, name, username, lori_coins")
        .eq("parent_id", parentId)
        .eq("role", "child")
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []).map((c) => ({ ...c, lori_coins: c.lori_coins ?? 0 })) as ChildSummary[]
    },

    async listTasks(field, id) {
      const { data, error } = await db
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq(field, id)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as Task[]
    },
  }

  return repo
}
