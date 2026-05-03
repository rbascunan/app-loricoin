"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

const earningHistory = [
  { date: "Hoy", description: "Ahorro diario", amount: 10 },
  { date: "Hoy", description: "Desafio completado", amount: 50 },
  { date: "Ayer", description: "Racha de 7 dias", amount: 25 },
  { date: "Ayer", description: "Leccion de inversion", amount: 15 },
  { date: "26 Abr", description: "Ahorro diario", amount: 10 },
]

export function LoricoinsSection() {
  const { isChildMode, selectedChild, currentUser } = useApp()

  const user = isChildMode && selectedChild ? selectedChild : currentUser

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
            <p className="text-xs text-sidebar-foreground/60 mt-2">
              Gana {nextMilestone - (user.loriCoins % nextMilestone)} LoriCoins mas para
              desbloquear una recompensa especial
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Como ganar LoriCoins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lori-success/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-lori-success" />
                </div>
                <div>
                  <p className="font-medium">Ahorra dinero</p>
                  <p className="text-xs text-muted-foreground">Cada vez que transfieras a ahorro</p>
                </div>
              </div>
              <Badge variant="secondary">+1 LC/$25</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Manten tu racha</p>
                  <p className="text-xs text-muted-foreground">Ahorra todos los dias</p>
                </div>
              </div>
              <Badge variant="secondary">+5 LC/dia</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Completa desafios</p>
                  <p className="text-xs text-muted-foreground">Desafios diarios y semanales</p>
                </div>
              </div>
              <Badge variant="secondary">+50-200 LC</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Aprende con LorIA</p>
                  <p className="text-xs text-muted-foreground">Completa lecciones financieras</p>
                </div>
              </div>
              <Badge variant="secondary">+15 LC</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Historial Reciente
            </CardTitle>
            <CardDescription>Tus ultimas ganancias de LoriCoins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earningHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className="font-semibold text-lori-success">+{item.amount} LC</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver historial completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Tienda de Recompensas
              </CardTitle>
              <CardDescription>Canjea tus LoriCoins por premios increibles</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Ver todo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
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
