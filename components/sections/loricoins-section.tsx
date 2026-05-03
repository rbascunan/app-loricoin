"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coins,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Info,
  Trophy,
  Medal,
  Award,
  CheckCircle2,
  Circle,
  Crown,
  Flame,
} from "lucide-react"

const rewards = [
  {
    id: "1",
    name: "Avatar Premium",
    description: "Desbloquea avatares exclusivos",
    cost: 200,
    icon: "🎭",
    category: "Personalizacion",
  },
  {
    id: "2",
    name: "Tema Espacial",
    description: "Cambia el aspecto de tu app",
    cost: 350,
    icon: "🚀",
    category: "Personalizacion",
  },
  {
    id: "3",
    name: "Boost de Ahorro",
    description: "2x LoriCoins por ahorro durante 1 semana",
    cost: 500,
    icon: "⚡",
    category: "Boost",
  },
  {
    id: "4",
    name: "Regalo Sorpresa",
    description: "Un regalo misterioso para ti",
    cost: 1000,
    icon: "🎁",
    category: "Recompensa",
  },
  {
    id: "5",
    name: "Insignia VIP",
    description: "Muestra tu estatus en la comunidad",
    cost: 750,
    icon: "👑",
    category: "Exclusivo",
  },
  {
    id: "6",
    name: "Sticker Pack",
    description: "Pack de stickers para usar en el chat",
    cost: 150,
    icon: "🌟",
    category: "Personalizacion",
  },
]

const positionIcons = [
  { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/20" },
  { icon: Award, color: "text-amber-700", bg: "bg-amber-700/20" },
]

export function LoricoinsSection() {
  const { 
    isChildMode, 
    selectedChild, 
    currentUser, 
    goldenRules, 
    loriCoinRules, 
    completedRules,
    getPodiumRanking,
    children 
  } = useApp()

  const user = isChildMode && selectedChild ? selectedChild : currentUser
  const userId = isChildMode && selectedChild ? selectedChild.id : currentUser.id
  const userCompletedRules = completedRules[userId] || []
  const podiumRanking = getPodiumRanking()

  const nextMilestone = 500
  const progressToMilestone = ((user.loriCoins % nextMilestone) / nextMilestone) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">LoriCoins</h1>
        <p className="text-muted-foreground">
          Tus monedas de recompensa en la blockchain Stellar
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-sidebar via-sidebar to-sidebar/80 text-sidebar-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -ml-24 -mb-24" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-sidebar-foreground/70 mb-1">Tu Balance</p>
              <div className="flex items-center gap-3">
                <Coins className="w-10 h-10 text-accent" />
                <span className="text-5xl font-bold">{user.loriCoins.toLocaleString()}</span>
              </div>
              <p className="text-sm text-sidebar-foreground/70 mt-2">LoriCoins</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-lori-success" />
                <span className="text-lori-success">+85 esta semana</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm">Protegido por Stellar</span>
              </div>
              {isChildMode && selectedChild && (
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Racha: {selectedChild.streakDays} dias</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-sidebar-accent/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-sm">Proximo hito: {nextMilestone} LC</span>
              </div>
              <span className="text-sm font-medium">{progressToMilestone.toFixed(0)}%</span>
            </div>
            <Progress value={progressToMilestone} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Rules, Podium, and Store */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Mandamientos</span>
            <span className="sm:hidden">Reglas</span>
          </TabsTrigger>
          <TabsTrigger value="podium" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Podio
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Tienda
          </TabsTrigger>
        </TabsList>

        {/* Golden Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                Los 10 Mandamientos del Dinero Inteligente
              </CardTitle>
              <CardDescription>
                Cumple estas reglas de oro para subir en el podio y ganar puntos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {goldenRules.map((rule, index) => {
                  const isCompleted = userCompletedRules.includes(rule.id)
                  return (
                    <div
                      key={rule.id}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isCompleted
                          ? "border-lori-success bg-lori-success/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${
                            isCompleted ? "bg-lori-success/20" : "bg-muted"
                          }`}
                        >
                          {rule.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            {isCompleted && (
                              <CheckCircle2 className="w-4 h-4 text-lori-success" />
                            )}
                          </div>
                          <h4 className="font-semibold text-sm">{rule.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rule.description}
                          </p>
                          <Badge
                            variant={isCompleted ? "default" : "secondary"}
                            className="mt-2"
                          >
                            +{rule.points} pts
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* LoriCoin Rules */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Reglas para Ganar LoriCoins
              </CardTitle>
              <CardDescription>
                Cada accion te da LoriCoins automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {loriCoinRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{rule.name}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    <Badge className="bg-accent text-accent-foreground">
                      +{rule.loriCoins} LoriCoins
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Podium Tab */}
        <TabsContent value="podium" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Podio de Campeones
              </CardTitle>
              <CardDescription>
                Ranking basado en puntos de las Reglas de Oro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Visual Podium */}
              <div className="flex justify-center items-end gap-4 mb-8 h-48">
                {/* 2nd Place */}
                {podiumRanking[1] && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-400/20 flex items-center justify-center text-3xl mb-2 border-4 border-gray-400">
                      {podiumRanking[1].avatar}
                    </div>
                    <p className="text-sm font-medium text-center">{podiumRanking[1].name}</p>
                    <p className="text-xs text-muted-foreground">{podiumRanking[1].totalPoints} pts</p>
                    <div className="w-24 h-24 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-center justify-center mt-2">
                      <span className="text-3xl font-bold text-white">2</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {podiumRanking[0] && (
                  <div className="flex flex-col items-center">
                    <Crown className="w-8 h-8 text-yellow-500 mb-1" />
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-4xl mb-2 border-4 border-yellow-500 animate-pulse">
                      {podiumRanking[0].avatar}
                    </div>
                    <p className="text-sm font-bold text-center">{podiumRanking[0].name}</p>
                    <p className="text-xs text-muted-foreground">{podiumRanking[0].totalPoints} pts</p>
                    <div className="w-28 h-32 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-center justify-center mt-2">
                      <span className="text-4xl font-bold text-white">1</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {podiumRanking[2] && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-amber-700/20 flex items-center justify-center text-2xl mb-2 border-4 border-amber-700">
                      {podiumRanking[2].avatar}
                    </div>
                    <p className="text-sm font-medium text-center">{podiumRanking[2].name}</p>
                    <p className="text-xs text-muted-foreground">{podiumRanking[2].totalPoints} pts</p>
                    <div className="w-20 h-16 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-center justify-center mt-2">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Ranking List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                  Ranking Completo
                </h4>
                {podiumRanking.map((child, index) => {
                  const PositionIcon = positionIcons[index]?.icon || Circle
                  const positionColor = positionIcons[index]?.color || "text-muted-foreground"
                  const positionBg = positionIcons[index]?.bg || "bg-muted"
                  const isCurrentUser = child.id === userId

                  return (
                    <div
                      key={child.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isCurrentUser
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${positionBg}`}
                      >
                        <PositionIcon className={`w-5 h-5 ${positionColor}`} />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-2xl border-2">
                        {child.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{child.name}</p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Tu
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {child.streakDays} dias
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{child.totalPoints}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Tienda de Recompensas
              </CardTitle>
              <CardDescription>Canjea tus LoriCoins por premios increibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => {
                  const canAfford = user.loriCoins >= reward.cost
                  return (
                    <Card
                      key={reward.id}
                      className={`relative overflow-hidden ${
                        !canAfford ? "opacity-60" : "hover:shadow-md transition-shadow"
                      }`}
                    >
                      <CardContent className="p-4">
                        <Badge variant="outline" className="absolute top-3 right-3 text-xs">
                          {reward.category}
                        </Badge>
                        <div className="text-4xl mb-3">{reward.icon}</div>
                        <h3 className="font-semibold">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-accent" />
                            <span className="font-semibold">{reward.cost}</span>
                          </div>
                          <Button size="sm" disabled={!canAfford} variant={canAfford ? "default" : "outline"}>
                            {canAfford ? "Canjear" : "Bloqueado"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stellar Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Que es Stellar?</h3>
              <p className="text-sm text-muted-foreground">
                Los LoriCoins estan respaldados por la blockchain de Stellar, una red segura y
                ecologica que permite transacciones rapidas. Esto significa que tus recompensas
                son reales, seguras y pueden crecer contigo a medida que aprendes sobre finanzas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
