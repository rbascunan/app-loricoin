import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export const LORIA_HISTORY_DAYS = 30
const MAX_CONTENT = 8000

export interface LoriaHistoryMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

const cutoff = () => new Date(Date.now() - LORIA_HISTORY_DAYS * 86_400_000).toISOString()

export async function saveLoriaMessage(userId: string, role: "user" | "assistant", content: string) {
  const text = content.trim().slice(0, MAX_CONTENT)
  if (!text) return
  const { error } = await createAdminClient()
    .from("loria_messages")
    .insert({ user_id: userId, role, content: text })
  if (error) console.error("[LorIA] No se pudo guardar el mensaje:", error.message)
}

export async function listLoriaHistory(userId: string): Promise<LoriaHistoryMessage[]> {
  const db = createAdminClient()
  // Older messages are pruned lazily so the history never exceeds one month.
  await db.from("loria_messages").delete().eq("user_id", userId).lt("created_at", cutoff())
  const { data, error } = await db
    .from("loria_messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .gte("created_at", cutoff())
    .order("created_at", { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }))
}

export async function clearLoriaHistory(userId: string) {
  const { error } = await createAdminClient().from("loria_messages").delete().eq("user_id", userId)
  if (error) throw new Error(error.message)
}
