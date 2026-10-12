const { createRequire } = require("module")
const { createCipheriv, createHash, randomBytes } = require("crypto")
const { Client } = createRequire("/tmp/mig/package.json")("pg")
const req = createRequire("/vercel/share/v0-project/package.json")
const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = req("@solana/web3.js")
const spl = req("@solana/spl-token")

const EXECUTE = process.env.EXECUTE === "1"

function encrypt(plain) {
  const key = createHash("sha256").update(process.env.WALLET_ENCRYPTION_KEY, "utf8").digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), auth_tag: cipher.getAuthTag().toString("base64") }
}

;(async () => {
  const conn = new Connection(process.env.SOLANA_RPC_URL, "confirmed")
  const authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_MINT_AUTHORITY_KEY)))
  const mint = new PublicKey(process.env.LORICOIN_MINT_ADDRESS)
  const programId = (await conn.getAccountInfo(mint)).owner

  const db = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, ""),
    ssl: { rejectUnauthorized: false },
  })
  await db.connect()
  try {
    const { rows } = await db.query(
      `select p.id, p.name, coalesce(p.lori_coins,0)::int as coins, s.public_key
       from public.profiles p left join public.child_wallet_secrets s on s.child_id = p.id
       where p.role = 'child' order by p.name`,
    )
    let total = 0
    for (const child of rows) {
      let address = child.public_key
      if (!address) {
        if (!EXECUTE) {
          console.log(`- ${child.name}: DB=${child.coins} | sin wallet (se crea) | a acuñar=${child.coins}`)
          total += child.coins
          continue
        }
        const kp = Keypair.generate()
        address = kp.publicKey.toBase58()
        const enc = encrypt(Buffer.from(kp.secretKey))
        await db.query(
          `insert into public.child_wallet_secrets (child_id, public_key, ciphertext, iv, auth_tag) values ($1,$2,$3,$4,$5)`,
          [child.id, address, enc.ciphertext, enc.iv, enc.auth_tag],
        )
        await db.query(`update public.profiles set wallet_address = $1 where id = $2`, [address, child.id])
      }
      const owner = new PublicKey(address)
      const ata = spl.getAssociatedTokenAddressSync(mint, owner, false, programId)
      const info = await conn.getAccountInfo(ata)
      const onchain = info ? Number((await conn.getTokenAccountBalance(ata)).value.amount) : 0
      const diff = child.coins - onchain
      console.log(`- ${child.name}: DB=${child.coins} | Solana=${onchain} | a acuñar=${Math.max(diff, 0)}${diff < 0 ? " (Solana tiene MÁS, no se toca)" : ""}`)
      if (diff <= 0) continue
      total += diff
      if (!EXECUTE) continue
      const tx = new Transaction().add(
        spl.createAssociatedTokenAccountIdempotentInstruction(authority.publicKey, ata, owner, mint, programId),
        spl.createMintToCheckedInstruction(mint, ata, authority.publicKey, diff, 0, [], programId),
      )
      const sig = await sendAndConfirmTransaction(conn, tx, [authority], { commitment: "confirmed" })
      const after = Number((await conn.getTokenAccountBalance(ata)).value.amount)
      console.log(`  acuñado ${diff} -> saldo Solana ${after} | tx ${sig}`)
    }
    console.log(`${EXECUTE ? "TOTAL ACUÑADO" : "TOTAL A ACUÑAR (simulación)"}: ${total} en ${rows.length} hijos`)
  } finally {
    await db.end()
  }
})().catch((e) => {
  console.error("FAIL", e.message)
  process.exitCode = 1
})
