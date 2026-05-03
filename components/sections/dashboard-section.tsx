"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  Trophy,
  Flame,
  Star,
} from "lucide-react"
import { financialTips } from "@/lib/mock-data"
import { useState, useEffect } from "react"
import Image from "next/image"

export function DashboardSection() {
  const { currentUser, selectedChild, isChildMode, transactions, challenges, children } = useApp()
  const [currentTip, setCurrentTip] = useState(0)

  const user = isChildMode && selectedChild ? selectedChild : currentUser
  const savingsProgress = (user.savings / user.savingsGoal) * 100

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % financialTips.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const recentTransactions = transactions.slice(0, 3)
  const activeChallenges = challenges.filter((c) => !c.completed).slice(0, 2)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Get streak and podium for child mode
  const childStreak = isChildMode && selectedChild ? selectedChild.streakDays : 0
  const childPodium = isChildMode && selectedChild ? selectedChild.podiumPosition : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header with Mascot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg overflow-hidden">
              <Image 
                src="/images/loricoin-mascot.png" 
                alt="LoriCoin" 
                width={56} 
                height={56}
                className="w-14 h-14 object-contain"
              />
            </div>
            {childStreak > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                <Flame className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hola, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground">
              {isChildMode ? "Veamos como van tus finanzas hoy" : "Gestiona las finanzas de tu familia"}
            </p>
            {childStreak > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">{childStreak} dias seguidos!</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Gamification Badges */}
        <div className="hidden md:flex items-center gap-3">
          {isChildMode && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full px-4 py-2 border border-yellow-200">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">#{childPodium}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-4 py-2 border border-emerald-200">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{user.loriCoins} LC</span>
          </div>
        </div>
      </div>

      {/* Financial Tip */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white shadow-lg overflow-hidden">
        <CardContent className="p-4 relative">
          <div className="absolute right-0 top-0 opacity-20">
            <Image 
              src="/images/loricoin-mascot.png" 
              alt="" 
              width={100} 
              height={100}
              className="w-24 h-24"
            />
          </div>
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Tip del dia</p>
              <p className="text-sm text-white font-medium">{financialTips[currentTip]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Gamified */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Balance Card */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Balance
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{formatCurrency(user.balance)}</div>
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12% vs. mes pasado</span>
            </p>
          </CardContent>
        </Card>

        {/* Savings Card */}
        <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-700">
              Ahorros
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-800">{formatCurrency(user.savings)}</div>
            <Progress value={savingsProgress} className="mt-2 h-2 bg-pink-100" />
            <p className="text-xs text-pink-600 mt-1">
              {savingsProgress.toFixed(0)}% de tu meta
            </p>
          </CardContent>
        </Card>

        {/* LoriCoins Card */}
        <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              LoriCoins
            </CardTitle>
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image 
                src="/images/loricoin-mascot.png" 
                alt="LoriCoins" 
                width={40} 
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{user.loriCoins}</div>
            <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+45 esta semana</span>
            </p>
          </CardContent>
        </Card>

        {/* Goal Card */}
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Meta Mensual
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">{formatCurrency(user.savingsGoal)}</div>
            <p className="text-xs text-emerald-600 mt-1">
              Faltan {formatCurrency(user.savingsGoal - user.savings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle>Movimientos Recientes</CardTitle>
                <CardDescription>Ultimas transacciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === "income" || tx.type === "reward"
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                        : tx.type === "expense"
                        ? "bg-gradient-to-br from-red-400 to-rose-500"
                        : "bg-gradient-to-br from-blue-400 to-indigo-500"
                    }`}
                  >
                    {tx.type === "income" || tx.type === "reward" ? (
                      <ArrowDownRight className="w-5 h-5 text-white" />
                    ) : tx.type === "expense" ? (
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      tx.type === "income" || tx.type === "reward"
                        ? "text-emerald-600"
                        : tx.type === "expense"
                        ? "text-red-600"
                        : "text-foreground"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.loriCoins && (
                    <p className="text-xs text-yellow-600 font-medium">+{tx.loriCoins} LC</p>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
              Ver todos los movimientos
            </Button>
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle>Desafios Activos</CardTitle>
                <CardDescription>Completa desafios para ganar LoriCoins</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{challenge.icon}</span>
                    <div>
                      <p className="font-bold text-purple-800">{challenge.title}</p>
                      <p className="text-xs text-purple-600">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {challenge.reward}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600 font-medium">Progreso</span>
                    <span className="font-bold text-purple-700">
                      {challenge.progress} / {challenge.total}
                    </span>
                  </div>
                  <Progress
                    value={(challenge.progress / challenge.total) * 100}
                    className="h-3 bg-purple-100"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
              Ver todos los desafios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Podium Preview for Parent Mode */}
      {!isChildMode && children.length > 0 && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <CardTitle>Podio Familiar</CardTitle>
            </div>
            <CardDescription>Ranking de tus hijos esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 py-4">
              {children
                .sort((a, b) => a.podiumPosition - b.podiumPosition)
                .slice(0, 3)
                .map((child, index) => (
                  <div 
                    key={child.id}
                    className={`flex flex-col items-center ${
                      index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"
                    }`}
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 border-4
                      ${index === 0 
                        ? "bg-yellow-400 border-yellow-500 shadow-lg" 
                        : index === 1 
                        ? "bg-gray-300 border-gray-400" 
                        : "bg-orange-300 border-orange-400"}
                    `}>
                      {child.avatar}
                    </div>
                    <div className={`
                      rounded-t-xl px-6 flex items-end justify-center
                      ${index === 0 
                        ? "bg-yellow-400 h-24" 
                        : index === 1 
                        ? "bg-gray-300 h-16" 
                        : "bg-orange-300 h-12"}
                    `}>
                      <span className="text-white font-bold text-2xl mb-2">{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium mt-2">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{child.totalPoints} pts</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
