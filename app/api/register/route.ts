import { createAdminClient } from "@/lib/supabase/admin"
import { handle, jsonError, readJson } from "@/lib/server/http"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WINDOW_MS = 10 * 60 * 1000
const MAX_SIGNUPS_PER_WINDOW = 5

// Best-effort per-instance throttle: demo signups skip email confirmation, so cap abuse per IP.
const recentSignups = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recentSignups.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  recentSignups.set(ip, hits)
  return hits.length > MAX_SIGNUPS_PER_WINDOW
}

export async function POST(req: Request) {
  return handle(async () => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (isRateLimited(ip)) return jsonError(429, "Demasiados intentos. Esperá unos minutos y probá de nuevo.")

    const body = (await readJson(req)) as { name?: unknown; email?: unknown; password?: unknown } | null
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!name || name.length > 40) return jsonError(400, "Ingresá tu nombre (hasta 40 caracteres).")
    if (!EMAIL_PATTERN.test(email) || email.length > 254 || email.endsWith(".invalid"))
      return jsonError(400, "Ingresá un correo válido.")
    if (password.length < 8 || password.length > 72)
      return jsonError(400, "La contraseña tiene que tener entre 8 y 72 caracteres.")

    const db = createAdminClient()
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { role: "parent", demo_signup: true },
    })

    if (error || !data.user) {
      if (error?.code === "email_exists" || /already/i.test(error?.message ?? ""))
        return jsonError(409, "Ya existe una cuenta con ese correo. Ingresá en vez de crear una nueva.")
      if (error?.code === "weak_password") return jsonError(400, "Elegí una contraseña más segura.")
      console.error("[register] createUser failed", error?.code, error?.message)
      return jsonError(500, "No pudimos crear la cuenta. Intentá de nuevo.")
    }

    const { error: profileError } = await db
      .from("profiles")
      .upsert({ id: data.user.id, name, role: "parent" }, { onConflict: "id" })
    if (profileError) {
      await db.auth.admin.deleteUser(data.user.id)
      console.error("[register] profile upsert failed", profileError.code, profileError.message)
      return jsonError(500, "No pudimos crear la cuenta. Intentá de nuevo.")
    }

    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } })
  })
}
