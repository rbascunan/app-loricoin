"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { User, Child, Transaction, Challenge, ChatMessage, Notification, GoldenRule, LoriCoinRule } from './types'
import { mockParent, mockChildren, mockTransactions, mockChallenges, mockNotifications, goldenRules, loriCoinRules } from './mock-data'

interface AppContextType {
  // Auth
  isLoggedIn: boolean
  login: (email: string, password: string, role: 'parent' | 'child') => Promise<boolean>
  logout: () => void
  
  // User data
  currentUser: User
  children: Child[]
  selectedChild: Child | null
  setSelectedChild: (child: Child | null) => void
  
  // Transactions
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  
  // Challenges
  challenges: Challenge[]
  updateChallenge: (id: string, progress: number) => void
  
  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setChatMessages: (messages: ChatMessage[]) => void
  
  // Mode
  isChildMode: boolean
  setIsChildMode: (mode: boolean) => void
  
  // Financial actions
  transferToChild: (childId: string, amount: number) => void
  addToSavings: (childId: string, amount: number) => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  unreadCount: number
  
  // Rules & LoriCoins
  goldenRules: GoldenRule[]
  loriCoinRules: LoriCoinRule[]
  addLoriCoins: (childId: string, amount: number, reason: string) => void
  checkGoldenRule: (ruleId: string, childId: string) => void
  completedRules: Record<string, string[]> // childId -> array of completed ruleIds
  
  // Podium
  getPodiumRanking: () => Child[]
  updatePodiumPosition: (childId: string, points: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User>(mockParent)
  const [childrenState, setChildrenState] = useState<Child[]>(mockChildren)
  const [selectedChild, setSelectedChild] = useState<Child | null>(mockChildren[0])
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChildMode, setIsChildMode] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [completedRules, setCompletedRules] = useState<Record<string, string[]>>({})

  // Auth functions
  const login = async (email: string, password: string, role: 'parent' | 'child'): Promise<boolean> => {
    // Simulate login - In production, this would call Supabase auth
    if (role === 'parent') {
      setCurrentUser(mockParent)
      setIsChildMode(false)
    } else {
      // Find child by name (for demo) or set first child
      const child = mockChildren[0]
      setCurrentUser({
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        role: 'child',
        balance: child.balance,
        loriCoins: child.loriCoins,
        savings: child.savings,
        savingsGoal: child.savingsGoal,
      })
      setSelectedChild(child)
      setIsChildMode(true)
    }
    setIsLoggedIn(true)
    return true
  }

  const logout = () => {
    setIsLoggedIn(false)
    setCurrentUser(mockParent)
    setIsChildMode(false)
  }

  // Notification functions
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // LoriCoins functions
  const addLoriCoins = useCallback((childId: string, amount: number, reason: string) => {
    setChildrenState((prev) =>
      prev.map((c) =>
        c.id === childId ? { ...c, loriCoins: c.loriCoins + amount } : c
      )
    )
    if (selectedChild?.id === childId) {
      setSelectedChild((prev) =>
        prev ? { ...prev, loriCoins: prev.loriCoins + amount } : prev
      )
    }
    
    // Add notification
    addNotification({
      userId: childId,
      type: 'loricoins',
      title: `+${amount} LoriCoins!`,
      message: reason,
      icon: '🪙',
      read: false,
    })
  }, [selectedChild, addNotification])

  // Golden Rules functions
  const checkGoldenRule = useCallback((ruleId: string, childId: string) => {
    const rule = goldenRules.find((r) => r.id === ruleId)
    if (!rule) return

    const childCompleted = completedRules[childId] || []
    if (childCompleted.includes(ruleId)) return // Already completed

    // Mark as completed
    setCompletedRules((prev) => ({
      ...prev,
      [childId]: [...(prev[childId] || []), ruleId],
    }))

    // Add points to child
    setChildrenState((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, totalPoints: c.totalPoints + rule.points }
          : c
      )
    )

    // Add notification
    addNotification({
      userId: childId,
      type: 'rule',
      title: `Regla de Oro completada!`,
      message: `Has logrado "${rule.name}" y ganaste ${rule.points} puntos!`,
      icon: rule.icon,
      read: false,
    })

    // Update podium positions
    updatePodiumPositions()
  }, [completedRules, addNotification])

  // Podium functions
  const getPodiumRanking = (): Child[] => {
    return [...childrenState].sort((a, b) => b.totalPoints - a.totalPoints)
  }

  const updatePodiumPositions = () => {
    const sorted = [...childrenState].sort((a, b) => b.totalPoints - a.totalPoints)
    setChildrenState(
      sorted.map((child, index) => {
        const newPosition = index + 1
        const oldPosition = child.podiumPosition
        
        // Notify if position improved
        if (newPosition < oldPosition) {
          addNotification({
            userId: child.id,
            type: 'podium',
            title: 'Subiste en el podio!',
            message: `Ahora estas en el puesto #${newPosition}. Sigue asi!`,
            icon: '🏆',
            read: false,
          })
        }
        
        return { ...child, podiumPosition: newPosition }
      })
    )
  }

  const updatePodiumPosition = (childId: string, points: number) => {
    setChildrenState((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, totalPoints: c.totalPoints + points }
          : c
      )
    )
    updatePodiumPositions()
  }

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])

    // Check if transaction triggers LoriCoin rules
    if (transaction.type === 'income') {
      const childId = childrenState.find((c) => c.name === transaction.to)?.id
      if (childId) {
        const rule = loriCoinRules.find((r) => r.triggerAction === 'money_received')
        if (rule) {
          addLoriCoins(childId, rule.loriCoins, `Ingreso: ${transaction.description}`)
        }
      }
    }
  }

  const updateChallenge = (id: string, progress: number) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const completed = progress >= c.total
          if (completed && !c.completed && selectedChild) {
            // Award LoriCoins for completing challenge
            const rule = loriCoinRules.find((r) => r.triggerAction === 'task_completed')
            if (rule) {
              addLoriCoins(selectedChild.id, rule.loriCoins, `Desafio completado: ${c.title}`)
            }
            // Check golden rule
            checkGoldenRule('rule-4', selectedChild.id)
          }
          return { ...c, progress, completed }
        }
        return c
      })
    )
  }

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, newMessage])
  }

  const transferToChild = (childId: string, amount: number) => {
    setCurrentUser((prev) => ({ ...prev, balance: prev.balance - amount }))
    setChildrenState((prev) =>
      prev.map((c) =>
        c.id === childId ? { ...c, balance: c.balance + amount } : c
      )
    )
    if (selectedChild?.id === childId) {
      setSelectedChild((prev) =>
        prev ? { ...prev, balance: prev.balance + amount } : prev
      )
    }
    addTransaction({
      type: 'transfer',
      amount,
      description: 'Transferencia de mesada',
      category: 'Mesada',
      date: new Date().toISOString().split('T')[0],
      from: currentUser.name,
      to: childrenState.find((c) => c.id === childId)?.name,
      loriCoins: Math.floor(amount / 50),
    })
  }

  const addToSavings = (childId: string, amount: number) => {
    setChildrenState((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, balance: c.balance - amount, savings: c.savings + amount }
          : c
      )
    )
    if (selectedChild?.id === childId) {
      setSelectedChild((prev) =>
        prev
          ? { ...prev, balance: prev.balance - amount, savings: prev.savings + amount }
          : prev
      )
    }
    
    // Check savings LoriCoin rule
    const rule = loriCoinRules.find((r) => r.triggerAction === 'savings_100')
    if (rule && amount >= 100) {
      const coinsToAdd = Math.floor(amount / 100) * rule.loriCoins
      addLoriCoins(childId, coinsToAdd, `Ahorro de $${amount}`)
    }

    // Check golden rule for weekly saving
    checkGoldenRule('rule-1', childId)

    addTransaction({
      type: 'transfer',
      amount,
      description: 'Ahorro',
      category: 'Ahorro',
      date: new Date().toISOString().split('T')[0],
      from: childrenState.find((c) => c.id === childId)?.name,
      to: 'Cuenta de Ahorro',
      loriCoins: Math.floor(amount / 25),
    })
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        currentUser,
        children: childrenState,
        selectedChild,
        setSelectedChild,
        transactions,
        addTransaction,
        challenges,
        updateChallenge,
        chatMessages,
        addChatMessage,
        setChatMessages,
        isChildMode,
        setIsChildMode,
        transferToChild,
        addToSavings,
        notifications,
        addNotification,
        markNotificationRead,
        unreadCount,
        goldenRules,
        loriCoinRules,
        addLoriCoins,
        checkGoldenRule,
        completedRules,
        getPodiumRanking,
        updatePodiumPosition,
      }}
    >
      {childrenProp}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
