export interface User {
  id: string
  name: string
  avatar: string
  role: 'parent' | 'child'
  balance: number
  loriCoins: number
  savings: number
  savingsGoal: number
}

export interface Child {
  id: string
  name: string
  avatar: string
  balance: number
  loriCoins: number
  savings: number
  savingsGoal: number
  weeklyAllowance: number
  spendingLimit: number
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
