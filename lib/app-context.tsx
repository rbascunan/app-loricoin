"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { User, Child, Transaction, Challenge, ChatMessage } from './types'
import { mockParent, mockChildren, mockTransactions, mockChallenges } from './mock-data'

interface AppContextType {
  currentUser: User
  children: Child[]
  selectedChild: Child | null
  setSelectedChild: (child: Child | null) => void
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  challenges: Challenge[]
  updateChallenge: (id: string, progress: number) => void
  chatMessages: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setChatMessages: (messages: ChatMessage[]) => void
  isChildMode: boolean
  setIsChildMode: (mode: boolean) => void
  transferToChild: (childId: string, amount: number) => void
  addToSavings: (childId: string, amount: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockParent)
  const [childrenState, setChildrenState] = useState<Child[]>(mockChildren)
  const [selectedChild, setSelectedChild] = useState<Child | null>(mockChildren[0])
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChildMode, setIsChildMode] = useState(false)

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
  }

  const updateChallenge = (id: string, progress: number) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, progress, completed: progress >= c.total }
          : c
      )
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
