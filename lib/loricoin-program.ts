import { Buffer } from "buffer"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"

export const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_LORICOIN_PROGRAM_ID ?? ""
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com"

export function getProgramId(): PublicKey | null {
  try {
    return PROGRAM_ID_STRING ? new PublicKey(PROGRAM_ID_STRING) : null
  } catch {
    return null
  }
}

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`
export const explorerAddress = (addr: string) =>
  `https://explorer.solana.com/address/${addr}?cluster=devnet`

const PROGRAM_ERRORS = [
  "Solo el padre o madre dueño de la familia puede hacer esta operación",
  "El texto no puede estar vacío",
  "El texto es demasiado largo",
  "La recompensa debe estar entre 1 y 1000 LoriCoins",
  "La tarea ya fue aprobada",
  "El hijo o hija tiene tareas pendientes y no se puede cerrar",
  "La cuenta del hijo o hija no pertenece a esta familia",
  "La tarea no pertenece a este hijo o hija",
  "Desbordamiento numérico",
]

export function describeProgramError(err: unknown): string {
  const text = String((err as { message?: string })?.message ?? err)
  const hex = text.match(/custom program error: 0x([0-9a-f]+)/i)
  const code = hex ? parseInt(hex[1], 16) : Number(text.match(/"Custom":(\d+)/)?.[1])
  if (code >= 6000 && PROGRAM_ERRORS[code - 6000]) return PROGRAM_ERRORS[code - 6000]
  if (/User rejected/i.test(text)) return "Rechazaste la firma en la wallet."
  if (/insufficient|0x1\b|debit an account/i.test(text))
    return "La wallet no tiene SOL suficiente en devnet. Pedí SOL en faucet.solana.com."
  return text.slice(0, 200)
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return new Uint8Array(digest)
}

const discriminator = async (prefix: "global" | "account", name: string) =>
  Buffer.from((await sha256(`${prefix}:${name}`)).slice(0, 8))

const encodeString = (value: string) => {
  const bytes = Buffer.from(value, "utf8")
  const len = Buffer.alloc(4)
  len.writeUInt32LE(bytes.length)
  return Buffer.concat([len, bytes])
}
const encodeU64 = (value: number) => {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(value))
  return buf
}
const le = (value: number, bytes: 2 | 4) => {
  const buf = Buffer.alloc(bytes)
  if (bytes === 2) buf.writeUInt16LE(value)
  else buf.writeUInt32LE(value)
  return buf
}

export const familyPda = (programId: PublicKey, parent: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("family"), parent.toBuffer()], programId)[0]
export const childPda = (programId: PublicKey, family: PublicKey, id: number) =>
  PublicKey.findProgramAddressSync([Buffer.from("child"), family.toBuffer(), le(id, 2)], programId)[0]
export const taskPda = (programId: PublicKey, child: PublicKey, id: number) =>
  PublicKey.findProgramAddressSync([Buffer.from("task"), child.toBuffer(), le(id, 4)], programId)[0]

class Reader {
  private offset = 8
  constructor(private data: Buffer) {}
  pubkey() {
    const key = new PublicKey(this.data.subarray(this.offset, this.offset + 32))
    this.offset += 32
    return key
  }
  u8() {
    return this.data.readUInt8(this.offset++)
  }
  u16() {
    const v = this.data.readUInt16LE(this.offset)
    this.offset += 2
    return v
  }
  u32() {
    const v = this.data.readUInt32LE(this.offset)
    this.offset += 4
    return v
  }
  u64() {
    const v = Number(this.data.readBigUInt64LE(this.offset))
    this.offset += 8
    return v
  }
  string() {
    const len = this.u32()
    const v = this.data.subarray(this.offset, this.offset + len).toString("utf8")
    this.offset += len
    return v
  }
}

export type FamilyAccount = { address: PublicKey; parent: PublicKey; name: string; nextChildId: number }
export type ChildAccount = {
  address: PublicKey
  family: PublicKey
  id: number
  name: string
  balance: number
  pendingTasks: number
  nextTaskId: number
}
export type TaskAccount = {
  address: PublicKey
  child: PublicKey
  id: number
  title: string
  reward: number
  approved: boolean
}
export type FamilyState = { family: FamilyAccount | null; children: (ChildAccount & { tasks: TaskAccount[] })[] }

async function listByOwner(connection: Connection, programId: PublicKey, account: string, owner: PublicKey) {
  const disc = await discriminator("account", account)
  const { default: bs58 } = await import("bs58")
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { memcmp: { offset: 0, bytes: bs58.encode(disc) } },
      { memcmp: { offset: 8, bytes: owner.toBase58() } },
    ],
  })
  return accounts.map(({ pubkey, account: info }) => ({ pubkey, data: Buffer.from(info.data) }))
}

export async function fetchFamilyState(
  connection: Connection,
  programId: PublicKey,
  parent: PublicKey,
): Promise<FamilyState> {
  const address = familyPda(programId, parent)
  const info = await connection.getAccountInfo(address)
  if (!info) return { family: null, children: [] }
  const r = new Reader(Buffer.from(info.data))
  const family: FamilyAccount = { address, parent: r.pubkey(), name: r.string(), nextChildId: r.u16() }

  const childRows = await listByOwner(connection, programId, "Child", address)
  const children = await Promise.all(
    childRows.map(async ({ pubkey, data }) => {
      const c = new Reader(data)
      const child: ChildAccount = {
        address: pubkey,
        family: c.pubkey(),
        id: c.u16(),
        name: c.string(),
        balance: c.u64(),
        pendingTasks: c.u16(),
        nextTaskId: c.u32(),
      }
      const taskRows = await listByOwner(connection, programId, "Task", pubkey)
      const tasks = taskRows
        .map(({ pubkey: taskAddress, data: taskData }) => {
          const t = new Reader(taskData)
          return {
            address: taskAddress,
            child: t.pubkey(),
            id: t.u32(),
            title: t.string(),
            reward: t.u64(),
            approved: t.u8() === 1,
          }
        })
        .sort((a, b) => a.id - b.id)
      return { ...child, tasks }
    }),
  )
  children.sort((a, b) => a.id - b.id)
  return { family, children }
}

type Meta = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }
const w = (pubkey: PublicKey): Meta => ({ pubkey, isSigner: false, isWritable: true })
const r = (pubkey: PublicKey): Meta => ({ pubkey, isSigner: false, isWritable: false })
const signer = (pubkey: PublicKey, isWritable: boolean): Meta => ({ pubkey, isSigner: true, isWritable })
const system = r(SystemProgram.programId)

async function ix(programId: PublicKey, name: string, keys: Meta[], args: Buffer[] = []) {
  const data = Buffer.concat([await discriminator("global", name), ...args])
  return new TransactionInstruction({ programId, keys, data })
}

export const instructions = {
  createFamily: (programId: PublicKey, parent: PublicKey, name: string) =>
    ix(programId, "create_family", [w(familyPda(programId, parent)), signer(parent, true), system], [
      encodeString(name),
    ]),
  addChild: (programId: PublicKey, parent: PublicKey, family: FamilyAccount, name: string) =>
    ix(
      programId,
      "add_child",
      [w(family.address), w(childPda(programId, family.address, family.nextChildId)), signer(parent, true), system],
      [encodeString(name)],
    ),
  createTask: (programId: PublicKey, parent: PublicKey, child: ChildAccount, title: string, reward: number) =>
    ix(
      programId,
      "create_task",
      [r(child.family), w(child.address), w(taskPda(programId, child.address, child.nextTaskId)), signer(parent, true), system],
      [encodeString(title), encodeU64(reward)],
    ),
  updateTaskReward: (programId: PublicKey, parent: PublicKey, child: ChildAccount, task: TaskAccount, reward: number) =>
    ix(
      programId,
      "update_task_reward",
      [r(child.family), w(child.address), w(task.address), signer(parent, false)],
      [encodeU64(reward)],
    ),
  approveTask: (programId: PublicKey, parent: PublicKey, child: ChildAccount, task: TaskAccount) =>
    ix(programId, "approve_task", [r(child.family), w(child.address), w(task.address), signer(parent, false)]),
  closeChild: (programId: PublicKey, parent: PublicKey, child: ChildAccount) =>
    ix(programId, "close_child", [r(child.family), w(child.address), signer(parent, true)]),
}

export type PhantomProvider = {
  publicKey: PublicKey | null
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  signTransaction: (tx: Transaction) => Promise<Transaction>
}

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider }
  return w.phantom?.solana ?? w.solana ?? null
}

export async function sendWithWallet(
  connection: Connection,
  wallet: PhantomProvider,
  payer: PublicKey,
  instruction: TransactionInstruction,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const tx = new Transaction({ feePayer: payer, blockhash, lastValidBlockHeight }).add(instruction)
  const signed = await wallet.signTransaction(tx)
  const signature = await connection.sendRawTransaction(signed.serialize())
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")
  if (result.value.err) throw new Error(JSON.stringify(result.value.err))
  return signature
}
