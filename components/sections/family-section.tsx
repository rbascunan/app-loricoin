"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wallet,
  PiggyBank,
  Coins,
  Send,
  Settings,
  Shield,
  Clock,
  TrendingUp,
  Plus,
  Minus,
  Target,
  Trophy,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

export function FamilySection() {
  const { currentUser, children, selectedChild, setSelectedChild, transferToChild, isChildMode, addTransaction } = useApp()
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [selectedChildForAction, setSelectedChildForAction] = useState<string | null>(null)
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  
  // Challenge form
  const [challengeTitle, setChallengeTitle] = useState("")
  const [challengeDescription, setChallengeDescription] = useState("")
  const [challengeReward, setChallengeReward] = useState("")
  const [challengeIcon, setChallengeIcon] = useState("star")
  
  // Goal form
  const [goalAmount, setGoalAmount] = useState("")
  const [goalDescription, setGoalDescription] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleTransfer = () => {
    if (selectedChildForAction && transferAmount) {
      transferToChild(selectedChildForAction, Number(transferAmount))
      setTransferAmount("")
      setTransferDialogOpen(false)
      setSelectedChildForAction(null)
    }
  }

  const handleAdjustBalance = () => {
    if (selectedChildForAction && adjustAmount && adjustReason) {
      const amount = Number(adjustAmount)
      const type = adjustType === "add" ? "income" : "expense"
      addTransaction({
        id: Date.now().toString(),
        type,
        amount,
        description: adjustReason,
        category: adjustType === "add" ? "Deposito" : "Retiro",
        date: new Date().toISOString(),
        from: adjustType === "subtract" ? selectedChildForAction : undefined,
        to: adjustType === "add" ? selectedChildForAction : undefined,
      })
      setAdjustAmount("")
      setAdjustReason("")
      setAdjustDialogOpen(false)
      setSelectedChildForAction(null)
    }
  }

  const handleCreateChallenge = () => {
    // Here you would add the challenge to the child
    console.log("[v0] Creating challenge:", {
      childId: selectedChildForAction,
      title: challengeTitle,
      description: challengeDescription,
      reward: Number(challengeReward),
      icon: challengeIcon,
    })
    setChallengeTitle("")
    setChallengeDescription("")
    setChallengeReward("")
    setChallengeDialogOpen(false)
    setSelectedChildForAction(null)
  }

  const handleSetGoal = () => {
    // Here you would update the child's savings goal
    console.log("[v0] Setting goal:", {
      childId: selectedChildForAction,
      amount: Number(goalAmount),
      description: goalDescription,
    })
    setGoalAmount("")
    setGoalDescription("")
    setGoalDialogOpen(false)
    setSelectedChildForAction(null)
  }

  const openAdjustDialog = (childId: string, type: "add" | "subtract") => {
    setSelectedChildForAction(childId)
    setAdjustType(type)
    setAdjustDialogOpen(true)
  }

  const openChallengeDialog = (childId: string) => {
    setSelectedChildForAction(childId)
    setChallengeDialogOpen(true)
  }

  const openGoalDialog = (childId: string) => {
    setSelectedChildForAction(childId)
    setGoalDialogOpen(true)
  }

  if (isChildMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            <Image 
              src="/images/loricoin-mascot.png" 
              alt="Familia" 
              width={32} 
              height={32}
              className="w-8 h-8"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mi Familia</h1>
            <p className="text-muted-foreground">Ve quienes forman parte de tu grupo familiar</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-3xl text-white">{currentUser.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                  <p className="text-sm text-muted-foreground">Padre/Madre</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">Administrador</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {children
            .filter((c) => c.id !== selectedChild?.id)
            .map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 border-4 border-white shadow-lg">
                      <AvatarFallback className="text-3xl text-white">{child.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">Hermano/a</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-medium">{child.loriCoins} LoriCoins</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <Image 
              src="/images/loricoin-mascot.png" 
              alt="Familia" 
              width={36} 
              height={36}
              className="w-9 h-9"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion Familiar</h1>
            <p className="text-muted-foreground">Administra las cuentas de tus hijos</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Hijo
        </Button>
      </div>

      {/* Parent Account Card */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 bg-white/20 border-2 border-white/50">
                <AvatarFallback className="text-2xl text-white">{currentUser.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                <p className="text-sm text-white/70">Cuenta Principal</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(currentUser.balance)}</p>
                <p className="text-xs text-white/70">Balance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{currentUser.loriCoins}</p>
                <p className="text-xs text-white/70">LoriCoins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {children.map((child) => {
          const savingsProgress = (child.savings / child.savingsGoal) * 100
          return (
            <Card
              key={child.id}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedChild?.id === child.id ? "border-emerald-500 shadow-emerald-100" : "border-transparent"
              }`}
              onClick={() => setSelectedChild(child)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 border-4 border-white shadow-lg">
                      <AvatarFallback className="text-2xl text-white">{child.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium text-yellow-600">{child.loriCoins} LoriCoins</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      #{child.podiumPosition} Podio
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Balance</span>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(child.balance)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                    <div className="flex items-center gap-2 text-pink-600 mb-1">
                      <PiggyBank className="w-4 h-4" />
                      <span className="text-xs font-medium">Ahorros</span>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(child.savings)}</p>
                  </div>
                </div>

                {/* Savings Goal */}
                <div className="space-y-2 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Target className="w-4 h-4" /> Meta de ahorro
                    </span>
                    <span className="font-bold text-emerald-600">{savingsProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={savingsProgress} className="h-3 bg-emerald-100" />
                  <p className="text-xs text-emerald-600">
                    {formatCurrency(child.savings)} de {formatCurrency(child.savingsGoal)}
                  </p>
                </div>

                {/* Info Row */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Mesada: {formatCurrency(child.weeklyAllowance)}/sem</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Limite: {formatCurrency(child.spendingLimit)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <Tabs defaultValue="dinero" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="dinero" className="text-xs">Dinero</TabsTrigger>
                    <TabsTrigger value="desafios" className="text-xs">Desafios</TabsTrigger>
                    <TabsTrigger value="metas" className="text-xs">Metas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="dinero" className="mt-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAdjustDialog(child.id, "add")
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Sumar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAdjustDialog(child.id, "subtract")
                        }}
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Restar
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedChildForAction(child.id)
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle>Enviar dinero a {child.name}</DialogTitle>
                            <DialogDescription>
                              Transfiere dinero a la cuenta de {child.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Monto a transferir</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Tu balance actual: {formatCurrency(currentUser.balance)}
                            </p>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              if (transferAmount) {
                                transferToChild(child.id, Number(transferAmount))
                                setTransferAmount("")
                              }
                            }} disabled={!transferAmount || Number(transferAmount) <= 0}>
                              Transferir
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="desafios" className="mt-3">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        openChallengeDialog(child.id)
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Crear Nuevo Desafio
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="metas" className="mt-3">
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        openGoalDialog(child.id)
                      }}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Definir Meta Mensual
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustType === "add" ? (
                <Plus className="w-5 h-5 text-emerald-600" />
              ) : (
                <Minus className="w-5 h-5 text-red-600" />
              )}
              {adjustType === "add" ? "Agregar" : "Retirar"} dinero
            </DialogTitle>
            <DialogDescription>
              {adjustType === "add" 
                ? "Agrega dinero a la billetera de tu hijo" 
                : "Retira dinero de la billetera de tu hijo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                placeholder="0"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder={adjustType === "add" ? "Ej: Mesada semanal" : "Ej: Compra de utiles"}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdjustBalance}
              className={adjustType === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              disabled={!adjustAmount || Number(adjustAmount) <= 0 || !adjustReason}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Crear Nuevo Desafio
            </DialogTitle>
            <DialogDescription>
              Crea un desafio para motivar a tu hijo a alcanzar metas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titulo del desafio</Label>
              <Input
                placeholder="Ej: Ahorrar $5000 este mes"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Describe que debe hacer para completar el desafio"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recompensa en LoriCoins</Label>
              <Input
                type="number"
                placeholder="50"
                value={challengeReward}
                onChange={(e) => setChallengeReward(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <Select value={challengeIcon} onValueChange={setChallengeIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="star">Estrella</SelectItem>
                  <SelectItem value="trophy">Trofeo</SelectItem>
                  <SelectItem value="target">Meta</SelectItem>
                  <SelectItem value="piggy">Ahorro</SelectItem>
                  <SelectItem value="book">Estudio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateChallenge}
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
              disabled={!challengeTitle || !challengeDescription || !challengeReward}
            >
              Crear Desafio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Definir Meta Mensual
            </DialogTitle>
            <DialogDescription>
              Establece una meta de ahorro mensual para tu hijo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto de la meta</Label>
              <Input
                type="number"
                placeholder="10000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Para que es la meta? (opcional)</Label>
              <Input
                placeholder="Ej: Ahorro para juguete, viaje, etc."
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSetGoal}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!goalAmount || Number(goalAmount) <= 0}
            >
              Establecer Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
