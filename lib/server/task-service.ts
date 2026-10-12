import type { ChildSummary, Profile, Task, TaskStatus } from "@/lib/loricoin/types"
import {
  LIMITS,
  MAX_ACTIVE_TASKS_PER_CHILD,
  childEmailFor,
  isUuid,
  isValidPin,
  isValidUsername,
  normalizeUsername,
  optionalText,
  parseReward,
  requiredText,
} from "@/lib/loricoin/rules"

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

export interface NewTask {
  parent_id: string
  child_id: string
  title: string
  description: string | null
  reward: number
}

export type CreateChildAccountResult =
  | { ok: true; id: string }
  | { ok: false; reason: "exists" | "weak_pin" | "error" }

/** Acceso a datos. En producción lo implementa Supabase con service_role; en las pruebas, un doble en memoria. */
export interface TaskRepo {
  getProfile(id: string): Promise<Profile | null>
  findProfileByUsername(username: string): Promise<Profile | null>
  createChildAccount(input: {
    email: string
    pin: string
    name: string
    username: string
    parentId: string
  }): Promise<CreateChildAccountResult>
  countActiveTasks(childId: string): Promise<number>
  insertTask(task: NewTask): Promise<Task>
  getTask(id: string): Promise<Task | null>
  /** UPDATE condicional: solo cambia la fila si su estado actual es `from`. Devuelve null si no actualizó nada. */
  transitionTask(id: string, from: TaskStatus, patch: Partial<Task>): Promise<Task | null>
  addLoriCoins(childId: string, amount: number): Promise<number>
}

export type PayRewardFn = (repo: TaskRepo, task: Task) => Promise<string | null>

const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
const fail = (status: number, error: string): ServiceResult<never> => ({ ok: false, status, error })
const now = () => new Date().toISOString()

const asRecord = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {}

const TASK_NOT_FOUND = "No encontramos esa tarea"
const ONLY_PARENTS = "Solo un padre o una madre puede hacer esto"

/**
 * Acredita la recompensa. Hoy suma LoriCoins en la base; el próximo paso la reemplaza
 * por una emisión real en Solana y devuelve la firma de la transacción.
 */
export const payReward: PayRewardFn = async (repo, task) => {
  await repo.addLoriCoins(task.child_id, task.reward)
  return null
}

async function getParent(repo: TaskRepo, actorId: string): Promise<Profile | null> {
  const profile = await repo.getProfile(actorId)
  return profile?.role === "parent" ? profile : null
}

export async function createChild(
  repo: TaskRepo,
  actorId: string,
  input: unknown,
): Promise<ServiceResult<ChildSummary>> {
  const parent = await getParent(repo, actorId)
  if (!parent) return fail(403, "Solo un padre o una madre puede crear cuentas de hijos")

  const body = asRecord(input)
  const name = requiredText(body.name, LIMITS.childName)
  if (!name) return fail(400, `Ingresá un nombre de hasta ${LIMITS.childName} caracteres`)

  const username = normalizeUsername(body.username)
  if (!isValidUsername(username)) {
    return fail(400, "El usuario tiene que tener entre 3 y 20 letras minúsculas o números, sin espacios")
  }
  if (!isValidPin(body.pin)) return fail(400, "El PIN tiene que tener exactamente 6 números")

  if (await repo.findProfileByUsername(username)) {
    return fail(409, "Ese usuario ya existe. Probá con otro.")
  }

  const created = await repo.createChildAccount({
    email: childEmailFor(username),
    pin: body.pin,
    name,
    username,
    parentId: parent.id,
  })
  if (!created.ok) {
    if (created.reason === "exists") return fail(409, "Ese usuario ya existe. Probá con otro.")
    if (created.reason === "weak_pin") return fail(400, "Ese PIN es demasiado fácil. Elegí otro.")
    return fail(500, "No se pudo crear la cuenta. Intentá de nuevo.")
  }

  return ok({ id: created.id, name, username, lori_coins: 0 })
}

export async function createTask(repo: TaskRepo, actorId: string, input: unknown): Promise<ServiceResult<Task>> {
  const parent = await getParent(repo, actorId)
  if (!parent) return fail(403, ONLY_PARENTS)

  const body = asRecord(input)
  if (!isUuid(body.childId)) return fail(400, "Elegí a qué hijo le asignás la tarea")

  const child = await repo.getProfile(body.childId)
  if (!child || child.role !== "child" || child.parent_id !== parent.id) {
    return fail(404, "No encontramos a ese hijo en tu familia")
  }

  const title = requiredText(body.title, LIMITS.taskTitle)
  if (!title) return fail(400, `El título es obligatorio y puede tener hasta ${LIMITS.taskTitle} caracteres`)

  const description = optionalText(body.description, LIMITS.taskDescription)
  if (description === undefined) {
    return fail(400, `La descripción puede tener hasta ${LIMITS.taskDescription} caracteres`)
  }

  const reward = parseReward(body.reward)
  if (reward === null) return fail(400, "La recompensa tiene que ser un número entero entre 1 y 50")

  if ((await repo.countActiveTasks(child.id)) >= MAX_ACTIVE_TASKS_PER_CHILD) {
    return fail(409, `${child.name} ya tiene ${MAX_ACTIVE_TASKS_PER_CHILD} tareas activas. Resolvé alguna antes de crear otra.`)
  }

  const task = await repo.insertTask({ parent_id: parent.id, child_id: child.id, title, description, reward })
  return ok(task)
}

export async function completeTask(repo: TaskRepo, actorId: string, taskId: string): Promise<ServiceResult<Task>> {
  if (!isUuid(taskId)) return fail(404, TASK_NOT_FOUND)

  const task = await repo.getTask(taskId)
  if (!task || task.child_id !== actorId) return fail(404, TASK_NOT_FOUND)

  const updated = await repo.transitionTask(taskId, "pendiente", { status: "terminada", done_at: now() })
  if (!updated) return fail(409, "Esta tarea ya no está pendiente")
  return ok(updated)
}

async function getOwnedTask(
  repo: TaskRepo,
  actorId: string,
  taskId: string,
): Promise<ServiceResult<Task>> {
  const parent = await getParent(repo, actorId)
  if (!parent) return fail(403, ONLY_PARENTS)
  if (!isUuid(taskId)) return fail(404, TASK_NOT_FOUND)

  const task = await repo.getTask(taskId)
  if (!task || task.parent_id !== parent.id) return fail(404, TASK_NOT_FOUND)
  return ok(task)
}

export async function approveTask(
  repo: TaskRepo,
  actorId: string,
  taskId: string,
  pay: PayRewardFn = payReward,
): Promise<ServiceResult<{ task: Task; signature: string | null }>> {
  const owned = await getOwnedTask(repo, actorId, taskId)
  if (!owned.ok) return owned

  // El UPDATE condicional es el candado: de dos aprobaciones simultáneas solo una lo gana.
  const claimed = await repo.transitionTask(taskId, "terminada", { status: "pagada", resolved_at: now() })
  if (!claimed) return fail(409, "Esta tarea ya fue resuelta o todavía no está terminada")

  try {
    const signature = await pay(repo, claimed)
    return ok({ task: claimed, signature })
  } catch (error) {
    console.error("[tasks] payReward failed", { taskId, message: (error as Error)?.message })
    await repo.transitionTask(taskId, "pagada", { status: "terminada", resolved_at: null })
    return fail(502, "No se pudo acreditar la recompensa. La tarea sigue terminada; probá aprobarla de nuevo.")
  }
}

export async function rejectTask(
  repo: TaskRepo,
  actorId: string,
  taskId: string,
  input: unknown,
): Promise<ServiceResult<Task>> {
  const owned = await getOwnedTask(repo, actorId, taskId)
  if (!owned.ok) return owned

  const note = optionalText(asRecord(input).note, LIMITS.rejectionNote)
  if (note === undefined) return fail(400, `La nota puede tener hasta ${LIMITS.rejectionNote} caracteres`)

  const updated = await repo.transitionTask(taskId, "terminada", {
    status: "rechazada",
    rejection_note: note,
    resolved_at: now(),
  })
  if (!updated) return fail(409, "Esta tarea ya fue resuelta o todavía no está terminada")
  return ok(updated)
}
