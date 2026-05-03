export interface User {
  id: string
  name: string
  email?: string
  avatar: string
  avatarUrl?: string
  role: 'parent' | 'child'
  balance: number
  loriCoins: number
  savings: number
  savingsGoal: number
}

export interface Child {
  id: string
  name: string
  fullName?: string
  avatar: string
  avatarUrl?: string
  balance: number
  loriCoins: number
  savings: number
  savingsGoal: number
  weeklyAllowance: number
  spendingLimit: number
  streakDays: number
  podiumPosition: number
  totalPoints: number
}

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer' | 'reward'
  amount: number
  description: string
  category: string
  date: string
  from?: string
  to?: string
  loriCoins?: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  reward: number
  progress: number
  total: number
  completed: boolean
  icon: string
}

export interface GameAchievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface NotionLesson {
  id: string
  notionPageId: string
  title: string
  content: string
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  loriCoinsReward: number
}

// Reglas de Oro para gamificacion
export interface GoldenRule {
  id: string
  name: string
  description: string
  icon: string
  points: number
  checkCondition: string // Identifier for the condition to check
}

// Reglas para ganar LoriCoins
export interface LoriCoinRule {
  id: string
  name: string
  description: string
  loriCoins: number
  triggerAction: string // Action that triggers this rule
}

// Notificacion
export interface Notification {
  id: string
  userId: string
  type: 'achievement' | 'podium' | 'loricoins' | 'challenge' | 'rule'
  title: string
  message: string
  icon: string
  read: boolean
  createdAt: string
}

// Podio
export interface PodiumEntry {
  childId: string
  childName: string
  avatar: string
  totalPoints: number
  position: number
  rulesCompleted: number
  streak: number
}
