import type { TaskStatus } from "./types"

export const CHILD_EMAIL_DOMAIN = "hijos.loricoin.invalid"
export const USERNAME_PATTERN = /^[a-z0-9]{3,20}$/
export const PIN_PATTERN = /^\d{6}$/
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MIN_REWARD = 1
export const MAX_REWARD = 50
/** Tope de un canje en la tienda; es independiente del tope de pago por tarea. */
export const MAX_REDEEM_PRICE = 100_000
export const MAX_ACTIVE_TASKS_PER_CHILD = 20
export const ACTIVE_TASK_STATUSES: TaskStatus[] = ["pendiente", "terminada", "pagando"]
export const DAILY_FAMILY_MINT_LIMIT = 200
export const MIN_AUTHORITY_SOL_TO_PAY = 0.02
export const PAYMENT_STALE_MS = 2 * 60 * 1000
export const SOLANA_CLUSTER = "devnet"

export const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`
export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`
export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`
export const PENALTY_LIMITS = { reason: 120, maxAmount: 50 } as const

export const LIMITS = {
  childName: 40,
  taskTitle: 80,
  taskDescription: 500,
  rejectionNote: 300,
} as const

/** Quita tildes, espacios de los extremos y pasa a minúsculas. No inventa caracteres válidos. */
export function normalizeUsername(raw: unknown): string {
  if (typeof raw !== "string") return ""
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username)
}

/** Regla determinista: el mismo usuario siempre produce el mismo correo interno. */
export function childEmailFor(rawUsername: unknown): string {
  const username = normalizeUsername(rawUsername)
  if (!isValidUsername(username)) {
    throw new Error("Usuario inválido")
  }
  return `${username}@${CHILD_EMAIL_DOMAIN}`
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && PIN_PATTERN.test(pin)
}

export function parseReward(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value < MIN_REWARD || value > MAX_REWARD) return null
  return value
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value)
}

/** Texto obligatorio: devuelve null si falta o supera el máximo. */
export function requiredText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null
}

/** Texto opcional: null si está vacío, undefined si es inválido. */
export function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.length <= max ? trimmed : undefined
}
