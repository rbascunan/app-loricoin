const u = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const k = process.env.SUPABASE_SERVICE_ROLE_KEY
const h = { apikey: k, Authorization: "Bearer " + k }
const r = await fetch(u + "/auth/v1/admin/users?per_page=500", { headers: h })
const j = await r.json()
const users = j.users || []
for (const x of users.filter((x) => x.email && x.email.startsWith("diag-v0-"))) {
  const d = await fetch(u + "/auth/v1/admin/users/" + x.id, { method: "DELETE", headers: h })
  console.log("borrado", x.email, d.status)
}
console.log("usuarios reales restantes:", users.filter((x) => !x.email?.startsWith("diag-v0-")).length)
