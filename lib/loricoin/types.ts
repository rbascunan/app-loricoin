export type Role = "parent" | "child"

export type TaskStatus = "pendiente" | "terminada" | "pagada" | "rechazada"

export interface Profile {
  id: string
  name: string
  role: Role
  parent_id: string | null
  username: string | null
  lori_coins: number
}

export interface ChildSummary {
  id: string
  name: string
  username: string | null
  lori_coins: number
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
}

export interface Penalty {
  id: string
  parent_id: string
  child_id: string
  reason: string
  amount: number
  created_at: string
}

export interface MeResponse {
  profile: Profile
  children: ChildSummary[]
  tasks: Task[]
  penalties: Penalty[]
}
