import { getSessionUserId, jsonError, unauthorized } from "@/lib/server/http"
import { clearLoriaHistory, listLoriaHistory } from "@/lib/server/loria-history"

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()
  try {
    const messages = await listLoriaHistory(userId)
    return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[LorIA] Error leyendo historial:", error)
    return jsonError(500, "No se pudo cargar el historial")
  }
}

export async function DELETE() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()
  try {
    await clearLoriaHistory(userId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("[LorIA] Error borrando historial:", error)
    return jsonError(500, "No se pudo borrar el historial")
  }
}
