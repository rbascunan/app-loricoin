"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { COMMUNITY_KIDS } from "@/lib/loricoin-assets"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Users,
  Target,
  Coins,
  Lock,
  CheckCircle2,
  Crown,
} from "lucide-react"
import { mockChallenges, mockAchievements } from "@/lib/mock-data"

const leaderboard = [
  { rank: 1, name: "Tony S.", avatar: "👦", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ni%C3%B1os%20varios%205.jpg-DWyTNtcHFgMqhfVLh5nK8nmWrDgPd8.webp", loriCoins: 2850, streak: 15 },
  { rank: 2, name: "Mei L.", avatar: "👧", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ni%C3%B1os%20varios%206-UKmAtH4fnZtmugi3E7UMHBik2D3LMw.jpg", loriCoins: 2640, streak: 12 },
  { rank: 3, name: "Lucas M.", avatar: "👦", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ni%C3%B1os%20varios%202-v6A7Sc22VPrN1NPldNHcHloBW6HSis.jpg", loriCoins: 2450, streak: 10 },
  { rank: 4, name: "Sofia R.", avatar: "👧", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ni%C3%B1os%20varios%203.jpg-qzvHE78SoMq4XsWDC9Bh5mluYhbYp3.webp", loriCoins: 2200, streak: 8 },
  { rank: 5, name: "Betito", avatar: "⭐", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hijo%20Betito%20Bascu%C3%B1an-YuQ3dfEOOXKo6vvKWWN1y1SP7pDlGI.jpeg", loriCoins: 1980, streak: 7, isCurrentUser: true },
  { rank: 6, name: "Akali P.", avatar: "👧", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ni%C3%B1os%20varios%207-R2qVeqlhv1mDu4W6vqbkdLO2KnY6hO.jpg", loriCoins: 1850, streak: 6 },
  { rank: 7, name: "Martina B.", avatar: "👧", avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hija%20Martina%20Bascu%C3%B1an-gwPtceHKc1alEcvq8K8pnDC2JaPtBv.jpeg", loriCoins: 1720, streak: 5 },
]

const weeklyChallenge = {
  title: "Desafio Semanal: Super Ahorradores",
  description: "Ahorra $1,000 entre todos los participantes",
  currentProgress: 7500,
  totalGoal: 10000,
  participants: 156,
  reward: 200,
  endsIn: "3 dias",
}

export function CommunitySection() {
  const { isChildMode, selectedChild, currentUser } = useApp()

  const user = isChildMode && selectedChild ? selectedChild : currentUser

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunidad</h1>
        <p className="text-muted-foreground">
          Compite, aprende y diviertete con otros LoriSavers
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border-none">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <Badge className="mb-2 bg-accent text-accent-foreground">En curso</Badge>
                <h2 className="text-xl font-bold">{weeklyChallenge.title}</h2>
                <p className="text-sm text-muted-foreground">{weeklyChallenge.description}</p>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="flex items-center gap-2 lg:justify-end">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{weeklyChallenge.participants} participantes</span>
              </div>
              <p className="text-sm text-muted-foreground">Termina en {weeklyChallenge.endsIn}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de la comunidad</span>
              <span className="font-medium">
                ${weeklyChallenge.currentProgress.toLocaleString()} / $
                {weeklyChallenge.totalGoal.toLocaleString()}
              </span>
            </div>
            <Progress
              value={(weeklyChallenge.currentProgress / weeklyChallenge.totalGoal) * 100}
              className="h-3"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              <span className="font-semibold">{weeklyChallenge.reward} LoriCoins de recompensa</span>
            </div>
            <Button className="bg-primary hover:bg-primary/90">Participar</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Top Ahorradores de la Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-4 mb-8">
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-gray-300">
                      <AvatarImage src={leaderboard[1].avatarUrl} alt={leaderboard[1].name} className="object-cover" />
                      <AvatarFallback className="text-2xl">{leaderboard[1].avatar}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{leaderboard[1].name}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[1].loriCoins} LC</p>
                    <div className="w-20 h-16 bg-gray-300 rounded-t-lg mt-2 flex items-center justify-center">
                      <Medal className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-2 ring-4 ring-yellow-400">
                      <AvatarImage src={leaderboard[0].avatarUrl} alt={leaderboard[0].name} className="object-cover" />
                      <AvatarFallback className="text-3xl">{leaderboard[0].avatar}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{leaderboard[0].name}</p>
                    <p className="text-sm text-muted-foreground">{leaderboard[0].loriCoins} LC</p>
                    <div className="w-20 h-24 bg-yellow-400 rounded-t-lg mt-2 flex items-center justify-center">
                      <Crown className="w-10 h-10 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-amber-300">
                      <AvatarImage src={leaderboard[2].avatarUrl} alt={leaderboard[2].name} className="object-cover" />
                      <AvatarFallback className="text-2xl">{leaderboard[2].avatar}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{leaderboard[2].name}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[2].loriCoins} LC</p>
                    <div className="w-20 h-12 bg-amber-300 rounded-t-lg mt-2 flex items-center justify-center">
                      <Medal className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {leaderboard.slice(3).map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.isCurrentUser ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-center">{getRankIcon(player.rank)}</div>
                        <Avatar className="w-10 h-10 border-2 border-emerald-300">
                          <AvatarImage src={player.avatarUrl} alt={player.name} className="object-cover" />
                          <AvatarFallback>{player.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {player.name}
                            {player.isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Tu
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="w-3 h-3 text-accent" />
                            {player.streak} dias seguidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{player.loriCoins.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">LoriCoins</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
                <CardDescription>Estadisticas de esta semana</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold text-primary">#5</p>
                  <p className="text-sm text-muted-foreground">Tu posicion actual</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Coins className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="font-semibold">{user.loriCoins}</p>
                    <p className="text-xs text-muted-foreground">LoriCoins</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="font-semibold">7</p>
                    <p className="text-xs text-muted-foreground">Racha</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-semibold">3</p>
                    <p className="text-xs text-muted-foreground">Desafios</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-semibold">2</p>
                    <p className="text-xs text-muted-foreground">Logros</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Ver perfil completo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockChallenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={challenge.completed ? "bg-lori-success/5 border-lori-success/20" : ""}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{challenge.icon}</span>
                      <div>
                        <h3 className="font-semibold">{challenge.title}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                    {challenge.completed && (
                      <CheckCircle2 className="w-6 h-6 text-lori-success shrink-0" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">
                        {challenge.progress} / {challenge.total}
                      </span>
                    </div>
                    <Progress
                      value={(challenge.progress / challenge.total) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4 text-accent" />
                      <span className="font-medium">{challenge.reward} LoriCoins</span>
                    </div>
                    {challenge.completed ? (
                      <Badge className="bg-lori-success text-white">Completado</Badge>
                    ) : (
                      <Button size="sm" variant="outline">
                        Ver detalles
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {mockAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`text-center ${
                  achievement.unlocked
                    ? "bg-secondary/20"
                    : "bg-muted/30 opacity-70"
                }`}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                      achievement.unlocked
                        ? "bg-secondary"
                        : "bg-muted"
                    }`}
                  >
                    {achievement.unlocked ? (
                      <span className="text-3xl">{achievement.icon}</span>
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <Badge variant="outline" className="mt-3">
                      Desbloqueado
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
