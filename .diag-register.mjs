import { createClient } from "@supabase/supabase-js"

const db = createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const email = `diag-v0-${Date.now()}@example.com`
const { data, error } = await db.auth.admin.createUser({
  email,
  password: "12345678",
  email_confirm: true,
  user_metadata: { name: "diag" },
  app_metadata: { role: "parent", demo_signup: true },
})
console.log("createUser:", error ? { code: error.code, status: error.status, message: error.message } : "OK")
if (data?.user) {
  const { error: pe } = await db.from("profiles").upsert({ id: data.user.id, name: "diag", role: "parent" }, { onConflict: "id" })
  console.log("profile:", pe ? { code: pe.code, message: pe.message, details: pe.details } : "OK")
  const { error: de } = await db.auth.admin.deleteUser(data.user.id)
  console.log("cleanup:", de ? de.message : "OK")
}
