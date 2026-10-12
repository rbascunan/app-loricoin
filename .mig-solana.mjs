import { readFileSync } from "node:fs"
import pg from "pg"

const url = process.env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/g, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(readFileSync("scripts/010_solana_loricoins.sql", "utf8"))
  const { rows } = await client.query(
    "select table_name, column_name from information_schema.columns where table_schema='public' and table_name in ('wallets','tasks','penalties') and column_name in ('public_key','tx_signature','error_message') order by 1,2",
  )
  console.log("OK", JSON.stringify(rows))
} finally {
  await client.end()
}
