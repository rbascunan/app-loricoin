import "server-only"
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js"
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token"
import bs58 from "bs58"
import { PaymentPendingError, SolanaConfigError, SolanaTxError } from "@/lib/server/payment-errors"
import { MAX_REDEEM_PRICE, MAX_REWARD, MIN_REWARD } from "@/lib/loricoin/rules"

export const LORICOIN_DECIMALS = 0
export const HEALTHY_AUTHORITY_SOL = 0.05

const CONFIRM_DEADLINE_MS = 40_000
const POLL_MS = 1_500
const RESEND_MS = 4_000

export type SignatureOutcome = "confirmed" | "failed" | "expired" | "pending"

let connection: Connection | null = null
let authority: Keypair | null = null
let tokenProgram: PublicKey | null = null

export function getConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL
  if (!url) throw new SolanaConfigError("Falta SOLANA_RPC_URL")
  connection ??= new Connection(url, "confirmed")
  return connection
}

export function getAuthority(): Keypair {
  if (authority) return authority
  const raw = process.env.SOLANA_MINT_AUTHORITY_KEY
  if (!raw) throw new SolanaConfigError("Falta SOLANA_MINT_AUTHORITY_KEY")
  let bytes: unknown
  try {
    bytes = JSON.parse(raw)
  } catch {
    throw new SolanaConfigError("SOLANA_MINT_AUTHORITY_KEY no es un arreglo JSON válido")
  }
  if (!Array.isArray(bytes) || bytes.length !== 64 || !bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    throw new SolanaConfigError("SOLANA_MINT_AUTHORITY_KEY tiene que ser un arreglo JSON de 64 bytes")
  }
  authority = Keypair.fromSecretKey(Uint8Array.from(bytes as number[]))
  return authority
}

export function getMintAddress(): PublicKey {
  const raw = process.env.LORICOIN_MINT_ADDRESS
  if (!raw) throw new SolanaConfigError("Falta LORICOIN_MINT_ADDRESS")
  try {
    return new PublicKey(raw)
  } catch {
    throw new SolanaConfigError("LORICOIN_MINT_ADDRESS no es una dirección válida")
  }
}

/** Detecta si el mint usa el programa SPL clásico o Token-2022. */
async function getTokenProgram(): Promise<PublicKey> {
  if (tokenProgram) return tokenProgram
  const info = await getConnection().getAccountInfo(getMintAddress(), "confirmed")
  if (!info) throw new SolanaConfigError("LORICOIN_MINT_ADDRESS no existe en esta red")
  if (!info.owner.equals(TOKEN_PROGRAM_ID) && !info.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new SolanaConfigError("LORICOIN_MINT_ADDRESS no es un token SPL")
  }
  tokenProgram = info.owner
  return tokenProgram
}

export function validateMintAmount(amount: unknown): asserts amount is number {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < MIN_REWARD || amount > MAX_REWARD) {
    throw new RangeError(`La cantidad tiene que ser un entero entre ${MIN_REWARD} y ${MAX_REWARD}`)
  }
}

function validateBurnAmount(amount: unknown): asserts amount is number {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > MAX_REDEEM_PRICE) {
    throw new RangeError(`La cantidad a canjear tiene que ser un entero entre 1 y ${MAX_REDEEM_PRICE}`)
  }
}

export function createChildWallet(): { publicKey: string; secretKey: Uint8Array } {
  const keypair = Keypair.generate()
  return { publicKey: keypair.publicKey.toBase58(), secretKey: keypair.secretKey }
}

export function keypairFromSecret(secretKey: Uint8Array): Keypair {
  return Keypair.fromSecretKey(secretKey)
}

function parseOwner(address: string): PublicKey {
  try {
    return new PublicKey(address)
  } catch {
    throw new SolanaTxError("La dirección de la wallet del hijo no es válida")
  }
}

async function readStatus(conn: Connection, signature: string, searchHistory: boolean) {
  const { value } = await conn.getSignatureStatuses([signature], { searchTransactionHistory: searchHistory })
  const status = value[0]
  if (!status) return null
  if (status.err) return "failed" as const
  if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") return "confirmed" as const
  return null
}

/** Estado definitivo de una firma, o "pending" si su blockhash todavía puede aterrizar. */
export async function getSignatureOutcome(signature: string, lastValidBlockHeight: number): Promise<SignatureOutcome> {
  const conn = getConnection()
  const status = await readStatus(conn, signature, true)
  if (status) return status
  const height = await conn.getBlockHeight("confirmed")
  if (height <= lastValidBlockHeight) return "pending"
  return (await readStatus(conn, signature, true)) ?? "expired"
}

async function waitForOutcome(
  conn: Connection,
  signature: string,
  raw: Buffer,
  lastValidBlockHeight: number,
  deadline: number,
): Promise<SignatureOutcome | "timeout"> {
  let lastSend = Date.now()
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    try {
      const status = await readStatus(conn, signature, false)
      if (status) return status
      if ((await conn.getBlockHeight("confirmed")) > lastValidBlockHeight) {
        return (await readStatus(conn, signature, true)) ?? "expired"
      }
      if (Date.now() - lastSend > RESEND_MS) {
        lastSend = Date.now()
        // Reenviar los mismos bytes firmados es idempotente: misma firma, se procesa una sola vez.
        await conn.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 0 }).catch(() => undefined)
      }
    } catch {
      // Un error transitorio del RPC no prueba nada; seguimos consultando hasta el plazo.
    }
  }
  return "timeout"
}

/**
 * Firma, envía y espera confirmación. Solo vuelve a firmar (nuevo blockhash) cuando la firma anterior
 * está vencida y comprobadamente no aterrizó, así nunca puede haber dos transacciones válidas a la vez.
 */
async function sendWithSafeRetry(
  instructions: TransactionInstruction[],
  signers: Keypair[],
  onSigned?: (signature: string, lastValidBlockHeight: number) => Promise<void>,
): Promise<string> {
  const conn = getConnection()
  const deadline = Date.now() + CONFIRM_DEADLINE_MS

  for (let attempt = 0; attempt < 2; attempt++) {
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed")
    const tx = new Transaction({ feePayer: signers[0]!.publicKey, blockhash, lastValidBlockHeight }).add(...instructions)
    tx.sign(...signers)
    const signature = bs58.encode(tx.signature!)
    const raw = tx.serialize()

    await onSigned?.(signature, lastValidBlockHeight)

    try {
      await conn.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 0 })
    } catch (error) {
      if (error instanceof SendTransactionError) {
        throw new SolanaTxError("Solana rechazó la transacción en la simulación")
      }
      // Error de red al enviar: puede haber llegado igual, así que seguimos consultando.
    }

    const outcome = await waitForOutcome(conn, signature, raw, lastValidBlockHeight, deadline)
    if (outcome === "confirmed") return signature
    if (outcome === "failed") throw new SolanaTxError("La transacción falló en Solana")
    if (outcome === "timeout" || outcome === "pending") throw new PaymentPendingError(signature)
  }
  throw new SolanaTxError("La transacción venció dos veces sin confirmarse")
}

export async function mintLoricoins(
  childPublicKey: string,
  amount: number,
  onSigned?: (signature: string, lastValidBlockHeight: number) => Promise<void>,
): Promise<string> {
  validateMintAmount(amount)
  const owner = parseOwner(childPublicKey)
  const payer = getAuthority()
  const mint = getMintAddress()
  const programId = await getTokenProgram()
  const ata = getAssociatedTokenAddressSync(mint, owner, false, programId)

  return sendWithSafeRetry(
    [
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, ata, owner, mint, programId),
      createMintToCheckedInstruction(mint, ata, payer.publicKey, amount, LORICOIN_DECIMALS, [], programId),
    ],
    [payer],
    onSigned,
  )
}

/** Quema LoriCoins de la wallet del hijo (descuentos). La autoridad paga la comisión. */
export async function burnLoricoins(childSecretKey: Uint8Array, amount: number): Promise<string> {
  validateBurnAmount(amount)
  const child = keypairFromSecret(childSecretKey)
  const payer = getAuthority()
  const mint = getMintAddress()
  const programId = await getTokenProgram()
  const ata = getAssociatedTokenAddressSync(mint, child.publicKey, false, programId)

  return sendWithSafeRetry(
    [createBurnCheckedInstruction(ata, mint, child.publicKey, amount, LORICOIN_DECIMALS, [], programId)],
    [payer, child],
  )
}

export async function getLoricoinBalance(childPublicKey: string): Promise<number> {
  const conn = getConnection()
  const programId = await getTokenProgram()
  const ata = getAssociatedTokenAddressSync(getMintAddress(), parseOwner(childPublicKey), false, programId)
  const info = await conn.getAccountInfo(ata, "confirmed")
  if (!info) return 0
  const { value } = await conn.getTokenAccountBalance(ata, "confirmed")
  return Number(value.amount)
}

export async function getAuthoritySolBalance(): Promise<number> {
  const lamports = await getConnection().getBalance(getAuthority().publicKey, "confirmed")
  return lamports / LAMPORTS_PER_SOL
}

export interface SolanaHealth {
  ok: boolean
  cluster: "devnet"
  rpc: { ok: boolean; version: string | null }
  authority: { address: string | null; sol: number | null; sufficient: boolean }
  mint: {
    address: string | null
    exists: boolean
    decimals: number | null
    decimalsOk: boolean
    authorityMatches: boolean
  }
  problems: string[]
}

export async function checkSolanaHealth(): Promise<SolanaHealth> {
  const problems: string[] = []
  const health: SolanaHealth = {
    ok: false,
    cluster: "devnet",
    rpc: { ok: false, version: null },
    authority: { address: null, sol: null, sufficient: false },
    mint: { address: null, exists: false, decimals: null, decimalsOk: false, authorityMatches: false },
    problems,
  }
  const note = (error: unknown, fallback: string) =>
    problems.push(error instanceof SolanaConfigError ? error.message : fallback)

  try {
    const version = await getConnection().getVersion()
    health.rpc = { ok: true, version: version["solana-core"] ?? null }
  } catch (error) {
    note(error, "El RPC no responde: revisá SOLANA_RPC_URL")
  }

  try {
    health.authority.address = getAuthority().publicKey.toBase58()
  } catch (error) {
    note(error, "Revisá SOLANA_MINT_AUTHORITY_KEY")
  }

  try {
    health.mint.address = getMintAddress().toBase58()
  } catch (error) {
    note(error, "Revisá LORICOIN_MINT_ADDRESS")
  }

  if (health.rpc.ok && health.authority.address) {
    try {
      const sol = await getAuthoritySolBalance()
      health.authority.sol = sol
      health.authority.sufficient = sol > HEALTHY_AUTHORITY_SOL
      if (!health.authority.sufficient) {
        problems.push(`La autoridad tiene ${sol} SOL; cargale más de ${HEALTHY_AUTHORITY_SOL} SOL en Devnet`)
      }
    } catch {
      problems.push("No se pudo leer el saldo de SOL de la autoridad")
    }
  }

  if (health.rpc.ok && health.mint.address) {
    try {
      const programId = await getTokenProgram()
      const mint = await getMint(getConnection(), getMintAddress(), "confirmed", programId)
      health.mint.exists = true
      health.mint.decimals = mint.decimals
      health.mint.decimalsOk = mint.decimals === LORICOIN_DECIMALS
      if (!health.mint.decimalsOk) problems.push("El token tiene que tener 0 decimales: revisá LORICOIN_MINT_ADDRESS")
      health.mint.authorityMatches =
        !!mint.mintAuthority && !!health.authority.address && mint.mintAuthority.toBase58() === health.authority.address
      if (!health.mint.authorityMatches) {
        problems.push("La mint authority del token no coincide con SOLANA_MINT_AUTHORITY_KEY")
      }
    } catch (error) {
      note(error, "No se encontró el token: revisá LORICOIN_MINT_ADDRESS y que SOLANA_RPC_URL sea Devnet")
    }
  }

  health.ok = problems.length === 0
  return health
}
