import type { ChildSummary, Profile, Task, TaskStatus } from "@/lib/loricoin/types"
import { PaymentPendingError, SolanaTxError } from "./payment-errors"
import {
  DAILY_FAMILY_MINT_LIMIT,
  LIMITS,
  MAX_ACTIVE_TASKS_PER_CHILD,
  MIN_AUTHORITY_SOL_TO_PAY,
  PAYMENT_STALE_MS,
  PENALTY_LIMITS,
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
  /** Devuelve la wallet del hijo; si todavía no tiene, la crea (clave secreta cifrada en el servidor). */
  getChildWalletAddress(childId: string): Promise<string>
  getChildWalletSecret(childId: string): Promise<Uint8Array>
  /** Reserva atómica: candado por familia, límite diario y paso a 'pagando'. */
  claimTaskPayment(taskId: string, parentId: string, dailyLimit: number): Promise<"ok" | "not_claimable" | "daily_limit">
  savePendingSignature(taskId: string, signature: string, lastValidBlockHeight: number): Promise<void>
  recordPenalty(input: {
    parentId: string
    childId: string
    reason: string
    amount: number
    signature: string
  }): Promise<{ id: string; balance: number }>
}

/** Puerto hacia Solana. En producción usa lib/solana.ts; en las pruebas, un doble simulado. */
export interface SolanaPort {
  authoritySol(): Promise<number>
  mint(
    address: string,
    amount: number,
    onSigned: (signature: string, lastValidBlockHeight: number) => Promise<void>,
  ): Promise<string>
  burn(secretKey: Uint8Array, amount: number): Promise<string>
  balance(address: string): Promise<number>
  signatureOutcome(signature: string, lastValidBlockHeight: number): Promise<"confirmed" | "failed" | "expired" | "pending">
}

const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
const fail = (status: number, error: string): ServiceResult<never> => ({ ok: false, status, error })
const now = () => new Date().toISOString()

const asRecord = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {}

const TASK_NOT_FOUND = "No encontramos esa tarea"
const ONLY_PARENTS = "Solo un padre o una madre puede hacer esto"

const SOLANA_UNAVAILABLE = "No pudimos conectar con Solana. Probá de nuevo en un momento."
const LOW_AUTHORITY_SOL =
  "La cuenta que emite LoriCoins no tiene SOL suficiente para pagar la comisión de Solana. Avisale al administrador."

/** Emite en Solana la recompensa guardada en la base (nunca un monto enviado por el cliente). */
export async function payReward(repo: TaskRepo, task: Task, solana: SolanaPort): Promise<string> {
  const address = await repo.getChildWalletAddress(task.child_id)
  return solana.mint(address, task.reward, (signature, height) =>
    repo.savePendingSignature(task.id, signature, height),
  )
}

async function hasEnoughSol(solana: SolanaPort): Promise<ServiceResult<true>> {
  try {
    const sol = await solana.authoritySol()
    return sol < MIN_AUTHORITY_SOL_TO_PAY ? fail(503, LOW_AUTHORITY_SOL) : ok(true)
  } catch (error) {
    console.error("[solana] authority balance failed", (error as Error)?.message)
    return fail(503, SOLANA_UNAVAILABLE)
  }
}

async function finalizePayment(repo: TaskRepo, task: Task, signature: string) {
  const paidAt = now()
  const paid = await repo.transitionTask(task.id, "pagando", {
    status: "pagada",
    tx_signature: signature,
    paid_at: paidAt,
    resolved_at: paidAt,
    error_message: null,
  })
  // lori_coins es solo una caché del saldo on-chain: si falla, la fuente de verdad sigue siendo Solana.
  await repo.addLoriCoins(task.child_id, task.reward).catch((error) =>
    console.error("[tasks] cache update failed", { taskId: task.id, message: (error as Error)?.message }),
  )
  return ok({ task: paid ?? { ...task, status: "pagada" as const, tx_signature: signature }, signature })
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

  const wallet = await repo.getChildWalletAddress(created.id).catch(() => null)
  return ok({ id: created.id, name, username, lori_coins: 0, wallet_address: wallet })
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
  solana: SolanaPort,
): Promise<ServiceResult<{ task: Task; signature: string }>> {
  const owned = await getOwnedTask(repo, actorId, taskId)
  if (!owned.ok) return owned
  const task = owned.data

  if (task.status === "pagando") {
    const startedAt = Date.parse(task.payment_started_at ?? "")
    if (Number.isFinite(startedAt) && Date.now() - startedAt <= PAYMENT_STALE_MS) {
      return fail(409, "Este pago ya se está enviando a Solana. Esperá unos segundos.")
    }
    // Pago trabado: antes de volver a emitir, comprobamos si la transacción anterior llegó.
    if (task.tx_signature && task.payment_last_valid_height) {
      let outcome: Awaited<ReturnType<SolanaPort["signatureOutcome"]>>
      try {
        outcome = await solana.signatureOutcome(task.tx_signature, task.payment_last_valid_height)
      } catch {
        return fail(503, SOLANA_UNAVAILABLE)
      }
      if (outcome === "confirmed") return finalizePayment(repo, task, task.tx_signature)
      if (outcome === "pending") return fail(409, "Solana todavía está procesando este pago. Probá en un minuto.")
    }
  } else if (task.status !== "terminada") {
    return fail(409, "Esta tarea ya fue resuelta o todavía no está terminada")
  }

  const sol = await hasEnoughSol(solana)
  if (!sol.ok) return sol

  // La reserva en la base es el candado: de dos aprobaciones simultáneas solo una la gana.
  const claim = await repo.claimTaskPayment(taskId, task.parent_id, DAILY_FAMILY_MINT_LIMIT)
  if (claim === "daily_limit") {
    return fail(
      429,
      `Tu familia llegó al límite de ${DAILY_FAMILY_MINT_LIMIT} LoriCoins emitidas por día. Podés aprobar esta tarea mañana.`,
    )
  }
  if (claim !== "ok") return fail(409, "Esta tarea ya fue resuelta o se está pagando")

  try {
    const signature = await payReward(repo, task, solana)
    return finalizePayment(repo, task, signature)
  } catch (error) {
    if (error instanceof PaymentPendingError) {
      // No sabemos si llegó: dejamos 'pagando' para no emitir dos veces. Se puede reintentar pasados 2 minutos.
      return fail(
        504,
        "Solana está tardando en confirmar el pago. La tarea queda en proceso; si en 2 minutos no aparece como pagada, aprobala de nuevo.",
      )
    }
    const message = error instanceof SolanaTxError ? error.message : "No se pudo enviar el pago a Solana"
    console.error("[tasks] payReward failed", { taskId, message: (error as Error)?.message })
    await repo.transitionTask(taskId, "pagando", {
      status: "terminada",
      error_message: message,
      tx_signature: null,
      payment_started_at: null,
      payment_last_valid_height: null,
    })
    return fail(502, `${message}. La tarea sigue terminada; probá aprobarla de nuevo.`)
  }
}

export async function penalizeChild(
  repo: TaskRepo,
  actorId: string,
  input: unknown,
  solana: SolanaPort,
): Promise<ServiceResult<{ amount: number; balance: number; signature: string }>> {
  const parent = await getParent(repo, actorId)
  if (!parent) return fail(403, "Solo un padre o madre puede descontar LoriCoins")

  const body = asRecord(input)
  const reason = requiredText(body.reason, PENALTY_LIMITS.reason)
  if (!reason) return fail(400, `El motivo tiene que tener entre 1 y ${PENALTY_LIMITS.reason} caracteres`)
  const amount = body.amount
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > PENALTY_LIMITS.maxAmount) {
    return fail(400, `El descuento tiene que ser un número entero entre 1 y ${PENALTY_LIMITS.maxAmount}`)
  }
  const child = isUuid(body.childId) ? await repo.getProfile(body.childId) : null
  if (!child || child.role !== "child" || child.parent_id !== parent.id) {
    return fail(404, "No encontramos a ese hijo en tu familia")
  }

  const sol = await hasEnoughSol(solana)
  if (!sol.ok) return sol

  let balance: number
  let address: string
  try {
    address = await repo.getChildWalletAddress(child.id)
    balance = await solana.balance(address)
  } catch {
    return fail(503, SOLANA_UNAVAILABLE)
  }
  const deduct = Math.min(amount, balance)
  if (deduct < 1) return fail(409, "No tiene LoriCoins para descontar")

  let signature: string
  try {
    signature = await solana.burn(await repo.getChildWalletSecret(child.id), deduct)
  } catch (error) {
    if (error instanceof PaymentPendingError) {
      return fail(504, "Solana está tardando en confirmar el descuento. Revisá los movimientos en unos minutos.")
    }
    console.error("[penalties] burn failed", (error as Error)?.message)
    return fail(502, "No se pudo registrar el descuento en Solana. Probá de nuevo.")
  }

  await repo.recordPenalty({ parentId: parent.id, childId: child.id, reason, amount: deduct, signature })
  return ok({ amount: deduct, balance: balance - deduct, signature })
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
