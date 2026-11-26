import { describe, expect, it } from "vitest"
import type { Profile, Task, TaskStatus } from "@/lib/loricoin/types"
import { PAYMENT_STALE_MS, childEmailFor, normalizeUsername, parseReward } from "@/lib/loricoin/rules"
import { PaymentPendingError, SolanaTxError } from "@/lib/server/payment-errors"
import {
  approveTask,
  completeTask,
  createChild,
  createTask,
  penalizeChild,
  rejectTask,
  type NewTask,
  type SolanaPort,
  type TaskRepo,
} from "@/lib/server/task-service"

const PARENT = "11111111-1111-4111-8111-111111111111"
const OTHER_PARENT = "22222222-2222-4222-8222-222222222222"
const CHILD = "33333333-3333-4333-8333-333333333333"
const OTHER_CHILD = "44444444-4444-4444-8444-444444444444"

const profile = (p: Omit<Profile, "lori_coins" | "wallet_address">): Profile => ({
  ...p,
  lori_coins: 0,
  wallet_address: null,
})

class MemoryRepo implements TaskRepo {
  profiles = new Map<string, Profile>()
  tasks = new Map<string, Task>()
  penalties: { childId: string; amount: number; signature: string }[] = []
  private seq = 0

  constructor() {
    this.add(profile({ id: PARENT, name: "Ana", role: "parent", parent_id: null, username: null , avatar: null, notifications_seen_at: null }))
    this.add(profile({ id: OTHER_PARENT, name: "Beto", role: "parent", parent_id: null, username: null , avatar: null, notifications_seen_at: null }))
    this.add(profile({ id: CHILD, name: "Lola", role: "child", parent_id: PARENT, username: "lola" , avatar: null, notifications_seen_at: null }))
    this.add(profile({ id: OTHER_CHILD, name: "Tomi", role: "child", parent_id: OTHER_PARENT, username: "tomi" , avatar: null, notifications_seen_at: null }))
  }

  add(p: Profile) {
    this.profiles.set(p.id, p)
  }

  async getProfile(id: string) {
    return this.profiles.get(id) ?? null
  }
  async findProfileByUsername(username: string) {
    return [...this.profiles.values()].find((p) => p.username === username) ?? null
  }
  async createChildAccount(input: { name: string; username: string; parentId: string }) {
    const id = `55555555-5555-4555-8555-${String(++this.seq).padStart(12, "0")}`
    this.add(profile({ id, name: input.name, role: "child", parent_id: input.parentId, username: input.username , avatar: null, notifications_seen_at: null }))
    return { ok: true as const, id }
  }
  async countActiveTasks(childId: string) {
    return [...this.tasks.values()].filter(
      (t) => t.child_id === childId && ["pendiente", "terminada", "pagando"].includes(t.status),
    ).length
  }
  async insertTask(task: NewTask) {
    const id = `66666666-6666-4666-8666-${String(++this.seq).padStart(12, "0")}`
    const row: Task = {
      ...task,
      id,
      status: "pendiente",
      rejection_note: null,
      created_at: new Date().toISOString(),
      done_at: null,
      resolved_at: null,
      tx_signature: null,
      paid_at: null,
      error_message: null,
      payment_started_at: null,
      payment_last_valid_height: null,
    }
    this.tasks.set(id, row)
    return row
  }
  async getTask(id: string) {
    return this.tasks.get(id) ?? null
  }
  async transitionTask(id: string, from: TaskStatus, patch: Partial<Task>) {
    const current = this.tasks.get(id)
    if (!current || current.status !== from) return null
    const next = { ...current, ...patch }
    this.tasks.set(id, next)
    return next
  }
  async addLoriCoins(childId: string, amount: number) {
    const p = this.profiles.get(childId)!
    p.lori_coins += amount
    return p.lori_coins
  }
  async getChildWalletAddress(childId: string) {
    return `wallet-${childId}`
  }
  async getChildWalletSecret() {
    return new Uint8Array(64)
  }
  async claimTaskPayment(taskId: string, parentId: string, dailyLimit: number) {
    const task = this.tasks.get(taskId)
    if (!task || task.parent_id !== parentId) return "not_claimable" as const
    const stale =
      task.status === "pagando" && Date.now() - Date.parse(task.payment_started_at ?? "") > PAYMENT_STALE_MS
    if (task.status !== "terminada" && !stale) return "not_claimable" as const
    const today = new Date().toISOString().slice(0, 10)
    const used = [...this.tasks.values()]
      .filter((t) => t.id !== taskId && t.parent_id === parentId)
      .filter((t) => t.status === "pagada" || t.status === "pagando")
      .filter((t) => (t.paid_at ?? t.payment_started_at ?? "").startsWith(today))
      .reduce((sum, t) => sum + t.reward, 0)
    if (used + task.reward > dailyLimit) return "daily_limit" as const
    this.tasks.set(taskId, {
      ...task,
      status: "pagando",
      payment_started_at: new Date().toISOString(),
      tx_signature: null,
      payment_last_valid_height: null,
    })
    return "ok" as const
  }
  async savePendingSignature(taskId: string, signature: string, height: number) {
    const task = this.tasks.get(taskId)
    if (task?.status === "pagando") {
      this.tasks.set(taskId, { ...task, tx_signature: signature, payment_last_valid_height: height })
    }
  }
  async recordPenalty(input: { childId: string; amount: number; signature: string }) {
    this.penalties.push(input)
    const balance = await this.addLoriCoins(input.childId, -input.amount)
    return { id: `pen-${this.penalties.length}`, balance }
  }
}

class FakeSolana implements SolanaPort {
  sol = 1
  balances = new Map<string, number>()
  mints: { address: string; amount: number }[] = []
  burns: number[] = []
  failMint: Error | null = null
  outcome: "confirmed" | "failed" | "expired" | "pending" = "expired"
  private seq = 0

  async authoritySol() {
    return this.sol
  }
  async mint(address: string, amount: number, onSigned: (s: string, h: number) => Promise<void>) {
    const signature = `sig-${++this.seq}`
    await onSigned(signature, 1000)
    if (this.failMint) throw this.failMint
    this.mints.push({ address, amount })
    this.balances.set(address, (this.balances.get(address) ?? 0) + amount)
    return signature
  }
  async burn(_secret: Uint8Array, amount: number) {
    this.burns.push(amount)
    const address = `wallet-${CHILD}`
    this.balances.set(address, (this.balances.get(address) ?? 0) - amount)
    return `burn-${++this.seq}`
  }
  async balance(address: string) {
    return this.balances.get(address) ?? 0
  }
  async signatureOutcome() {
    return this.outcome
  }
}

async function finishedTask(repo: MemoryRepo, reward = 10) {
  const created = await createTask(repo, PARENT, { childId: CHILD, title: "Ordenar la pieza", reward })
  if (!created.ok) throw new Error(created.error)
  const done = await completeTask(repo, CHILD, created.data.id)
  if (!done.ok) throw new Error(done.error)
  return done.data
}

describe("reglas", () => {
  it("el correo interno del hijo es determinista", () => {
    expect(childEmailFor("Lolá ")).toBe("lola@hijos.loricoin.invalid")
    expect(childEmailFor("lola")).toBe(childEmailFor("LOLA"))
    expect(() => childEmailFor("lo la")).toThrow()
    expect(normalizeUsername("  JOSÉ ")).toBe("jose")
  })

  it("la recompensa es un entero entre 1 y 50", () => {
    expect(parseReward(1)).toBe(1)
    expect(parseReward(50)).toBe(50)
    expect(parseReward(0)).toBeNull()
    expect(parseReward(51)).toBeNull()
    expect(parseReward(2.5)).toBeNull()
    expect(parseReward("10")).toBeNull()
  })
})

describe("cuentas de hijos", () => {
  it("solo un padre crea hijos, con PIN de 6 dígitos y usuario único", async () => {
    const repo = new MemoryRepo()
    expect((await createChild(repo, CHILD, { name: "X", username: "xx1", pin: "123456" })).ok).toBe(false)
    expect(await createChild(repo, PARENT, { name: "Mia", username: "mia", pin: "12345" })).toMatchObject({ status: 400 })
    expect(await createChild(repo, PARENT, { name: "Otra", username: "lola", pin: "123456" })).toMatchObject({ status: 409 })
    const ok = await createChild(repo, PARENT, { name: "Mia", username: "Mia", pin: "654321" })
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(repo.profiles.get(ok.data.id)?.parent_id).toBe(PARENT)
      expect(ok.data.wallet_address).toBe(`wallet-${ok.data.id}`)
    }
  })
})

describe("flujo de tareas", () => {
  it("un padre no puede asignar tareas a un hijo ajeno", async () => {
    const repo = new MemoryRepo()
    expect(await createTask(repo, PARENT, { childId: OTHER_CHILD, title: "X", reward: 5 })).toMatchObject({ status: 404 })
  })

  it("solo el hijo asignado puede marcarla terminada, una sola vez", async () => {
    const repo = new MemoryRepo()
    const t = await createTask(repo, PARENT, { childId: CHILD, title: "X", reward: 5 })
    if (!t.ok) throw new Error()
    expect(await completeTask(repo, OTHER_CHILD, t.data.id)).toMatchObject({ status: 404 })
    expect((await completeTask(repo, CHILD, t.data.id)).ok).toBe(true)
    expect(await completeTask(repo, CHILD, t.data.id)).toMatchObject({ status: 409 })
  })

  it("aprobar emite en Solana el monto guardado y registra la firma", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo, 7)
    const r = await approveTask(repo, PARENT, task.id, solana)
    expect(r.ok).toBe(true)
    expect(solana.mints).toEqual([{ address: `wallet-${CHILD}`, amount: 7 }])
    expect(repo.tasks.get(task.id)).toMatchObject({ status: "pagada", tx_signature: "sig-1" })
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(7)
  })

  it("otro padre o el hijo no pueden aprobar", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo)
    expect(await approveTask(repo, OTHER_PARENT, task.id, solana)).toMatchObject({ status: 404 })
    expect(await rejectTask(repo, OTHER_PARENT, task.id, {})).toMatchObject({ status: 404 })
    expect(await approveTask(repo, CHILD, task.id, solana)).toMatchObject({ status: 403 })
    expect(solana.mints).toHaveLength(0)
  })

  it("dos aprobaciones simultáneas emiten una sola vez", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo, 10)
    const results = await Promise.all([
      approveTask(repo, PARENT, task.id, solana),
      approveTask(repo, PARENT, task.id, solana),
      approveTask(repo, PARENT, task.id, solana),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(solana.mints).toHaveLength(1)
  })

  it("si Solana rechaza la transacción, vuelve a terminada y se puede reintentar", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo, 10)
    solana.failMint = new SolanaTxError("Solana rechazó la transacción")
    expect(await approveTask(repo, PARENT, task.id, solana)).toMatchObject({ status: 502 })
    expect(repo.tasks.get(task.id)).toMatchObject({ status: "terminada", tx_signature: null })

    solana.failMint = null
    expect((await approveTask(repo, PARENT, task.id, solana)).ok).toBe(true)
    expect(solana.mints).toHaveLength(1)
  })

  it("si la confirmación queda en duda, no vuelve a emitir hasta comprobarla", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo, 10)
    solana.failMint = new PaymentPendingError("timeout")
    expect(await approveTask(repo, PARENT, task.id, solana)).toMatchObject({ status: 504 })
    expect(repo.tasks.get(task.id)?.status).toBe("pagando")
    expect(await approveTask(repo, PARENT, task.id, solana)).toMatchObject({ status: 409 })

    // Pasados 2 minutos, si la firma anterior se confirmó, se cierra sin emitir de nuevo.
    const stuck = repo.tasks.get(task.id)!
    repo.tasks.set(task.id, { ...stuck, payment_started_at: new Date(Date.now() - PAYMENT_STALE_MS - 1000).toISOString() })
    solana.failMint = null
    solana.outcome = "confirmed"
    const r = await approveTask(repo, PARENT, task.id, solana)
    expect(r.ok).toBe(true)
    expect(solana.mints).toHaveLength(0)
    expect(repo.tasks.get(task.id)).toMatchObject({ status: "pagada", tx_signature: "sig-1" })
  })

  it("no emite si la autoridad no tiene SOL para la comisión", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    solana.sol = 0.001
    const task = await finishedTask(repo)
    expect(await approveTask(repo, PARENT, task.id, solana)).toMatchObject({ status: 503 })
    expect(repo.tasks.get(task.id)?.status).toBe("terminada")
  })

  it("respeta el límite diario de emisión por familia", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    for (let i = 0; i < 4; i++) {
      const t = await finishedTask(repo, 50)
      expect((await approveTask(repo, PARENT, t.id, solana)).ok).toBe(true)
      // Liberamos el cupo de tareas activas para la siguiente vuelta.
    }
    const extra = await finishedTask(repo, 1)
    expect(await approveTask(repo, PARENT, extra.id, solana)).toMatchObject({ status: 429 })
  })

  it("rechazar no emite y guarda la nota", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    const task = await finishedTask(repo)
    expect((await rejectTask(repo, PARENT, task.id, { note: "Faltó la cama" })).ok).toBe(true)
    expect(repo.tasks.get(task.id)).toMatchObject({ status: "rechazada", rejection_note: "Faltó la cama" })
    expect(await approveTask(repo, PARENT, task.id, solana)).toMatchObject({ status: 409 })
    expect(solana.mints).toHaveLength(0)
  })
})

describe("descuentos", () => {
  it("quema en Solana como máximo el saldo real del hijo", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    solana.balances.set(`wallet-${CHILD}`, 5)
    const r = await penalizeChild(repo, PARENT, { childId: CHILD, reason: "No hizo la tarea", amount: 8 }, solana)
    expect(r).toMatchObject({ ok: true, data: { amount: 5, balance: 0 } })
    expect(solana.burns).toEqual([5])
    expect(repo.penalties[0]).toMatchObject({ amount: 5, signature: "burn-1" })
    expect(await penalizeChild(repo, PARENT, { childId: CHILD, reason: "Otra", amount: 1 }, solana)).toMatchObject({
      status: 409,
    })
  })

  it("solo el padre de ese hijo puede descontar", async () => {
    const repo = new MemoryRepo()
    const solana = new FakeSolana()
    solana.balances.set(`wallet-${CHILD}`, 5)
    expect(await penalizeChild(repo, CHILD, { childId: CHILD, reason: "x", amount: 1 }, solana)).toMatchObject({ status: 403 })
    expect(await penalizeChild(repo, OTHER_PARENT, { childId: CHILD, reason: "x", amount: 1 }, solana)).toMatchObject({
      status: 404,
    })
    expect(await penalizeChild(repo, PARENT, { childId: CHILD, reason: "x", amount: 51 }, solana)).toMatchObject({ status: 400 })
    expect(solana.burns).toHaveLength(0)
  })
})
