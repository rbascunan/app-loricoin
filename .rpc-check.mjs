import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const args = {
  p_parent: "00000000-0000-0000-0000-000000000001",
  p_child: "00000000-0000-0000-0000-000000000002",
  p_reason: "prueba",
  p_amount: 1,
}

const a = await admin.rpc("apply_penalty", args)
console.log("service_role:", a.error?.message)
const b = await anon.rpc("apply_penalty", args)
console.log("anon:", b.error?.code, b.error?.message)
const c = await admin.from("penalties").select("id").limit(1)
console.log("select penalties:", c.error?.message ?? "ok")
