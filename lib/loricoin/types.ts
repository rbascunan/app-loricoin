export type Role = "parent" | "child"

export type TaskStatus = "pendiente" | "terminada" | "pagando" | "pagada" | "rechazada"

export interface Profile {
  id: string
  name: string
  role: Role
  parent_id: string | null
  username: string | null
  lori_coins: number
  wallet_address: string | null
  avatar: string | null
  notifications_seen_at: string | null
}

export interface ChildSummary {
  id: string
  name: string
  username: string | null
  lori_coins: number
  wallet_address: string | null
  avatar: string | null
}

export interface WalletBalance {
  childId: string
  address: string | null
  amount: number
  source: "chain" | "cache"
}

export interface WalletResponse {
  mint: string | null
  balances: WalletBalance[]
  chainOk: boolean
}

export interface Task {
  id: string
  parent_id: string
  child_id: string
  title: string
  description: string | null
  reward: number
  status: TaskStatus
  rejection_note: string | null
  created_at: string
  done_at: string | null
  resolved_at: string | null
  tx_signature: string | null
  paid_at: string | null
  error_message: string | null
  payment_started_at: string | null
  payment_last_valid_height: number | null
}

export interface Penalty {
  id: string
  parent_id: string
  child_id: string
  reason: string
  amount: number
  created_at: string
  tx_signature: string | null
}

export interface Reward {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  stock: number
  image_url: string | null
}

export type RedemptionStatus = "canjeado" | "entregado"

export interface Redemption {
  id: string
  reward_id: string
  child_id: string
  reward_name: string
  reward_image: string | null
  price: number
  status: RedemptionStatus
  tx_signature: string | null
  created_at: string
  redeemed_at: string | null
  delivered_at: string | null
}

export type BonusKind = "ranking" | "meta"
export type BonusStatus = "pendiente" | "pagando" | "pagada"

export interface Bonus {
  id: string
  child_id: string
  parent_id: string | null
  kind: BonusKind
  amount: number
  reason: string
  week_start: string | null
  goal_id: string | null
  status: BonusStatus
  tx_signature: string | null
  created_at: string
  paid_at: string | null
}

export type GoalStatus = "activa" | "cumplida" | "vencida" | "cancelada"

export interface SavingsGoal {
  id: string
  parent_id: string
  child_id: string
  title: string
  target: number
  bonus: number
  reward_id: string | null
  start_balance: number
  starts_at: string
  ends_at: string
  status: GoalStatus
  created_at: string
  completed_at: string | null
}

export interface RankingEntry {
  childId: string
  name: string
  avatar: string | null
  saved: number
  isMe: boolean
}

export interface RankingResponse {
  weekStart: string
  weekEnd: string
  entries: RankingEntry[]
  lastWinners: { childId: string; name: string; avatar: string | null; isMe: boolean }[]
}

export interface MeResponse {
  profile: Profile
  children: ChildSummary[]
  tasks: Task[]
  penalties: Penalty[]
  redemptions: Redemption[]
  bonuses: Bonus[]
  goals: SavingsGoal[]
}
