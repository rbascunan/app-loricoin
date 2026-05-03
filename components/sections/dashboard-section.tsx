"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  PiggyBank,
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
} from "lucide-react"
import { financialTips } from "@/lib/mock-data"
import { useState, useEffect } from "react"

export function DashboardSection() {
  const { currentUser, selectedChild, isChildMode, transactions, challenges } = useApp()
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            {isChildMode ? "Veamos como van tus finanzas hoy" : "Gestiona las finanzas de tu familia"}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">{user.loriCoins} LoriCoins</span>
        </div>
      </div>

      {/* Financial Tip */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Tip del dia</p>
              <p className="text-sm text-foreground">{financialTips[currentTip]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.balance)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-lori-success" />
              <span className="text-lori-success">+12%</span> vs. mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ahorros
            </CardTitle>
            <PiggyBank className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.savings)}</div>
            <Progress value={savingsProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {savingsProgress.toFixed(0)}% de tu meta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              LoriCoins
            </CardTitle>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.loriCoins}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-lori-success" />
              <span className="text-lori-success">+45</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meta Mensual
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.savingsGoal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Faltan {formatCurrency(user.savingsGoal - user.savings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
            <CardDescription>Ultimas transacciones realizadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "income" || tx.type === "reward"
                        ? "bg-lori-success/20"
                        : tx.type === "expense"
                        ? "bg-destructive/20"
                        : "bg-primary/20"
                    }`}
                  >
                    {tx.type === "income" || tx.type === "reward" ? (
                      <ArrowDownRight className="w-5 h-5 text-lori-success" />
                    ) : tx.type === "expense" ? (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      tx.type === "income" || tx.type === "reward"
                        ? "text-lori-success"
                        : tx.type === "expense"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.loriCoins && (
                    <p className="text-xs text-muted-foreground">+{tx.loriCoins} LC</p>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">
              Ver todos los movimientos
            </Button>
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <Card>
          <CardHeader>
            <CardTitle>Desafios Activos</CardTitle>
            <CardDescription>Completa desafios para ganar LoriCoins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{challenge.icon}</span>
                    <div>
                      <p className="font-medium">{challenge.title}</p>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Coins className="w-4 h-4" />
                    {challenge.reward}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span>
                      {challenge.progress} / {challenge.total}
                    </span>
                  </div>
                  <Progress
                    value={(challenge.progress / challenge.total) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">
              Ver todos los desafios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
