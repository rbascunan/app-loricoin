import { describe, expect, it } from "vitest"
import type { Profile, Task, TaskStatus } from "@/lib/loricoin/types"
import { childEmailFor, normalizeUsername, parseReward } from "@/lib/loricoin/rules"
import {
  approveTask,
  completeTask,
  createChild,
  createTask,
  rejectTask,
  type NewTask,
  type TaskRepo,
} from "@/lib/server/task-service"

const PARENT = "11111111-1111-4111-8111-111111111111"
const OTHER_PARENT = "22222222-2222-4222-8222-222222222222"
const CHILD = "33333333-3333-4333-8333-333333333333"
const OTHER_CHILD = "44444444-4444-4444-8444-444444444444"

class MemoryRepo implements TaskRepo {
  profiles = new Map<string, Profile>()
  tasks = new Map<string, Task>()
  private seq = 0

  constructor() {
    this.add({ id: PARENT, name: "Ana", role: "parent", parent_id: null, username: null, lori_coins: 0 })
    this.add({ id: OTHER_PARENT, name: "Beto", role: "parent", parent_id: null, username: null, lori_coins: 0 })
    this.add({ id: CHILD, name: "Lola", role: "child", parent_id: PARENT, username: "lola", lori_coins: 0 })
    this.add({ id: OTHER_CHILD, name: "Tomi", role: "child", parent_id: OTHER_PARENT, username: "tomi", lori_coins: 0 })
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
    this.add({ id, name: input.name, role: "child", parent_id: input.parentId, username: input.username, lori_coins: 0 })
    return { ok: true as const, id }
  }
  async countActiveTasks(childId: string) {
    return [...this.tasks.values()].filter(
      (t) => t.child_id === childId && (t.status === "pendiente" || t.status === "terminada"),
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
    }
    this.tasks.set(id, row)
    return row
  }
  async getTask(id: string) {
    return this.tasks.get(id) ?? null
  }
  async transitionTask(id: string, from: TaskStatus, patch: Partial<Task>) {
    // Equivale a UPDATE ... WHERE id = $1 AND status = $from (atómico)
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
    if (ok.ok) expect(repo.profiles.get(ok.data.id)?.parent_id).toBe(PARENT)
  })
})

describe("flujo de tareas", () => {
  it("un padre no puede asignar tareas a un hijo ajeno", async () => {
    const repo = new MemoryRepo()
    const r = await createTask(repo, PARENT, { childId: OTHER_CHILD, title: "X", reward: 5 })
    expect(r).toMatchObject({ ok: false, status: 404 })
  })

  it("rechaza recompensas fuera de rango", async () => {
    const repo = new MemoryRepo()
    expect(await createTask(repo, PARENT, { childId: CHILD, title: "X", reward: 51 })).toMatchObject({ status: 400 })
  })

  it("solo el hijo asignado puede marcarla terminada, una sola vez", async () => {
    const repo = new MemoryRepo()
    const t = await createTask(repo, PARENT, { childId: CHILD, title: "X", reward: 5 })
    if (!t.ok) throw new Error()
    expect(await completeTask(repo, OTHER_CHILD, t.data.id)).toMatchObject({ status: 404 })
    expect((await completeTask(repo, CHILD, t.data.id)).ok).toBe(true)
    expect(await completeTask(repo, CHILD, t.data.id)).toMatchObject({ status: 409 })
  })

  it("aprobar paga el monto guardado en la base, no uno enviado por el cliente", async () => {
    const repo = new MemoryRepo()
    const task = await finishedTask(repo, 7)
    const r = await approveTask(repo, PARENT, task.id)
    expect(r.ok).toBe(true)
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(7)
  })

  it("otro padre no puede aprobar ni rechazar", async () => {
    const repo = new MemoryRepo()
    const task = await finishedTask(repo)
    expect(await approveTask(repo, OTHER_PARENT, task.id)).toMatchObject({ status: 404 })
    expect(await rejectTask(repo, OTHER_PARENT, task.id, {})).toMatchObject({ status: 404 })
    expect(await approveTask(repo, CHILD, task.id)).toMatchObject({ status: 403 })
  })

  it("dos aprobaciones simultáneas pagan una sola vez", async () => {
    const repo = new MemoryRepo()
    const task = await finishedTask(repo, 10)
    const results = await Promise.all([
      approveTask(repo, PARENT, task.id),
      approveTask(repo, PARENT, task.id),
      approveTask(repo, PARENT, task.id),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(10)
  })

  it("si el pago falla, la tarea vuelve a terminada y se puede reintentar", async () => {
    const repo = new MemoryRepo()
    const task = await finishedTask(repo, 10)
    const failing = await approveTask(repo, PARENT, task.id, async () => {
      throw new Error("RPC caído")
    })
    expect(failing).toMatchObject({ ok: false, status: 502 })
    expect(repo.tasks.get(task.id)?.status).toBe("terminada")
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(0)

    expect((await approveTask(repo, PARENT, task.id)).ok).toBe(true)
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(10)
  })

  it("rechazar no paga y guarda la nota", async () => {
    const repo = new MemoryRepo()
    const task = await finishedTask(repo)
    const r = await rejectTask(repo, PARENT, task.id, { note: "Faltó la cama" })
    expect(r.ok).toBe(true)
    expect(repo.tasks.get(task.id)).toMatchObject({ status: "rechazada", rejection_note: "Faltó la cama" })
    expect(repo.profiles.get(CHILD)?.lori_coins).toBe(0)
    expect(await approveTask(repo, PARENT, task.id)).toMatchObject({ status: 409 })
  })
})
