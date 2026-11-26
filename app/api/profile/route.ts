import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, jsonError, readJson, unauthorized } from "@/lib/server/http"
import { requiredText } from "@/lib/loricoin/rules"

const MAX_AVATAR_CHARS = 300_000
const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

export async function PATCH(req: Request) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()

    const repo = createSupabaseRepo()
    const me = await repo.getProfile(userId)
    if (!me) return jsonError(404, "No encontramos tu perfil")

    const body = (await readJson(req)) as Record<string, unknown>
    const profilePatch: Record<string, unknown> = {}

    if (body.avatar !== undefined) {
      if (body.avatar === null) profilePatch.avatar = null
      else if (typeof body.avatar === "string" && body.avatar.length <= MAX_AVATAR_CHARS && AVATAR_PATTERN.test(body.avatar))
        profilePatch.avatar = body.avatar
      else return jsonError(400, "La foto no es válida o es muy grande")
    }

    if (body.name !== undefined) {
      if (me.role !== "parent") return jsonError(403, "Solo tu papá o tu mamá puede cambiar tu nombre")
      const name = requiredText(body.name, 60)
      if (!name) return jsonError(400, "Escribí tu nombre")
      profilePatch.name = name
    }

    if (Object.keys(profilePatch).length === 0) return jsonError(400, "No hay cambios para guardar")

    const db = createAdminClient()
    const { error } = await db.from("profiles").update(profilePatch).eq("id", userId)
    if (error) throw error
    if (typeof profilePatch.name === "string") {
      await db.auth.admin.updateUserById(userId, { user_metadata: { name: profilePatch.name } })
    }

    const updated = await repo.getProfile(userId)
    return Response.json({ id: userId, name: updated?.name, avatar: updated?.avatar ?? null })
  })
}
