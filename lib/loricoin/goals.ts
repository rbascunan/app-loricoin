export const RANKING_PRIZE = 50
export const RANKING_WINNERS = 3

export const GOAL_LIMITS = {
  title: 80,
  minTarget: 10,
  maxTarget: 5000,
  minBonus: 5,
  maxBonus: 50,
  minMonths: 1,
  maxMonths: 12,
  maxActivePerChild: 3,
} as const

const AR_OFFSET_MS = -3 * 60 * 60 * 1000

/** Lunes (YYYY-MM-DD) de la semana actual en hora de Argentina. */
export function weekStartAR(date = new Date()): string {
  const local = new Date(date.getTime() + AR_OFFSET_MS)
  const daysSinceMonday = (local.getUTCDay() + 6) % 7
  local.setUTCDate(local.getUTCDate() - daysSinceMonday)
  return local.toISOString().slice(0, 10)
}

export function goalProgress(saved: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((saved / target) * 100)))
}
