const u = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const k = process.env.SUPABASE_SERVICE_ROLE_KEY
const h = { apikey: k, Authorization: "Bearer " + k, "content-type": "application/json" }
const email = `diag-v0-${Date.now()}@example.com`
const c = await fetch(u + "/auth/v1/admin/users", {
  method: "POST", headers: h,
  body: JSON.stringify({ email, password: "Diag12345678", email_confirm: true, user_metadata: { name: "Diag" }, app_metadata: { role: "parent" } }),
})
const cj = await c.json().catch(() => ({}))
console.log("createUser", c.status, cj.code || "", cj.msg || cj.message || cj.error_description || "", cj.id ? "id ok" : "")
if (cj.id) {
  const p = await fetch(u + "/rest/v1/profiles?on_conflict=id", {
    method: "POST", headers: { ...h, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: cj.id, name: "Diag", role: "parent" }),
  })
  console.log("profiles upsert", p.status, (await p.text()).slice(0, 200))
}
const l = await fetch(u + "/auth/v1/admin/users?per_page=200", { headers: h })
const lj = await l.json().catch(() => ({}))
for (const x of (lj.users || []).filter((x) => x.email?.startsWith("diag-v0-"))) {
  const d = await fetch(u + "/auth/v1/admin/users/" + x.id, { method: "DELETE", headers: h })
  console.log("borrado", x.email, d.status)
}
console.log("usuarios totales", (lj.users || []).length)
