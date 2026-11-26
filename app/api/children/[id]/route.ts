import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseRepo } from "@/lib/server/supabase-repo"
import { getSessionUserId, handle, jsonError, readJson, unauthorized } from "@/lib/server/http"
import { childEmailFor, isUuid, isValidPin, isValidUsername, normalizeUsername, requiredText } from "@/lib/loricoin/rules"

const MAX_AVATAR_CHARS = 300_000
const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await getSessionUserId()
    if (!userId) return unauthorized()
    const { id } = await params
    if (!isUuid(id)) return jsonError(404, "No encontramos a ese hijo")

    const repo = createSupabaseRepo()
    const [actor, child] = await Promise.all([repo.getProfile(userId), repo.getProfile(id)])
    if (!child || child.role !== "child") return jsonError(404, "No encontramos a ese hijo")
    const isParent = actor?.role === "parent" && child.parent_id === userId
    const isSelf = userId === id
    if (!isParent && !isSelf) return jsonError(403, "No podés editar este perfil")

    const body = (await readJson(req)) as Record<string, unknown>
    const profilePatch: Record<string, unknown> = {}
    const authPatch: { email?: string; password?: string; user_metadata?: object; app_metadata?: object } = {}

    if (body.avatar !== undefined) {
      if (body.avatar === null) profilePatch.avatar = null
      else if (typeof body.avatar === "string" && body.avatar.length <= MAX_AVATAR_CHARS && AVATAR_PATTERN.test(body.avatar))
        profilePatch.avatar = body.avatar
      else return jsonError(400, "La foto no es válida o es muy grande")
    }

    if (!isParent && (body.name !== undefined || body.username !== undefined || body.pin !== undefined)) {
      return jsonError(403, "Solo tu papá o tu mamá puede cambiar tu nombre, usuario o PIN")
    }

    if (body.name !== undefined) {
      const name = requiredText(body.name, 60)
      if (!name) return jsonError(400, "Escribí un nombre")
      profilePatch.name = name
      authPatch.user_metadata = { name }
    }

    if (body.username !== undefined) {
      const username = normalizeUsername(body.username)
      if (!isValidUsername(username)) return jsonError(400, "El usuario debe tener entre 3 y 20 letras o números")
      if (username !== child.username) {
        const existing = await repo.findProfileByUsername(username)
        if (existing && existing.id !== id) return jsonError(409, "Ese usuario ya está en uso")
        profilePatch.username = username
        authPatch.email = childEmailFor(username)
        authPatch.app_metadata = { role: "child", parent_id: child.parent_id, username }
      }
    }

    if (body.pin !== undefined && body.pin !== "") {
      if (!isValidPin(body.pin)) return jsonError(400, "El PIN tiene que tener 6 números")
      authPatch.password = body.pin
    }

    if (Object.keys(profilePatch).length === 0 && Object.keys(authPatch).length === 0) {
      return jsonError(400, "No hay cambios para guardar")
    }

    const db = createAdminClient()
    if (Object.keys(authPatch).length > 0) {
      const { error } = await db.auth.admin.updateUserById(id, { ...authPatch, email_confirm: true })
      if (error) {
        console.error("[children] auth update failed", error.code, error.message)
        if (error.code === "weak_password") return jsonError(400, "Elegí un PIN menos fácil de adivinar")
        if (error.code === "email_exists") return jsonError(409, "Ese usuario ya está en uso")
        return jsonError(500, "No pudimos actualizar la cuenta. Probá de nuevo.")
      }
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await db.from("profiles").update(profilePatch).eq("id", id)
      if (error) {
        if (error.code === "23505") return jsonError(409, "Ese usuario ya está en uso")
        throw error
      }
    }

    const updated = await repo.getProfile(id)
    return Response.json({
      id,
      name: updated?.name,
      username: updated?.username,
      avatar: updated?.avatar ?? null,
    })
  })
}
