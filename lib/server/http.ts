import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ServiceResult } from "./task-service"

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export const jsonError = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } })

export const unauthorized = () => jsonError(401, "Tenés que iniciar sesión")

export async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => null)
}

export function respond<T>(result: ServiceResult<T>, successStatus = 200) {
  return result.ok
    ? Response.json(result.data, { status: successStatus, headers: { "Cache-Control": "no-store" } })
    : jsonError(result.status, result.error)
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (error) {
    console.error("[api] unexpected error", (error as Error)?.message)
    return jsonError(500, "Ocurrió un error inesperado. Intentá de nuevo.")
  }
}
