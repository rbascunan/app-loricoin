"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"

export function FamilySection() {
  const { currentUser, children, selectedChild, setSelectedChild, transferToChild, isChildMode } = useApp()
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [selectedChildForTransfer, setSelectedChildForTransfer] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleTransfer = () => {
    if (selectedChildForTransfer && transferAmount) {
      transferToChild(selectedChildForTransfer, Number(transferAmount))
      setTransferAmount("")
      setTransferDialogOpen(false)
      setSelectedChildForTransfer(null)
    }
  }

  const openTransferDialog = (childId: string) => {
    setSelectedChildForTransfer(childId)
    setTransferDialogOpen(true)
  }

  if (isChildMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Familia</h1>
          <p className="text-muted-foreground">Ve quienes forman parte de tu grupo familiar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-primary/20">
                  <AvatarFallback className="text-3xl">{currentUser.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                  <p className="text-sm text-muted-foreground">Padre/Madre</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary">Administrador</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {children
            .filter((c) => c.id !== selectedChild?.id)
            .map((child) => (
              <Card key={child.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 bg-secondary/50">
                      <AvatarFallback className="text-3xl">{child.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">Hermano/a</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Coins className="w-4 h-4 text-accent" />
                        <span className="text-xs">{child.loriCoins} LoriCoins</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion Familiar</h1>
          <p className="text-muted-foreground">Administra las cuentas de tus hijos</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Hijo
        </Button>
      </div>

      <Card className="bg-sidebar text-sidebar-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 bg-primary/20">
                <AvatarFallback className="text-2xl">{currentUser.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                <p className="text-sm text-sidebar-foreground/70">Cuenta Principal</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(currentUser.balance)}</p>
                <p className="text-xs text-sidebar-foreground/70">Balance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{currentUser.loriCoins}</p>
                <p className="text-xs text-sidebar-foreground/70">LoriCoins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {children.map((child) => {
          const savingsProgress = (child.savings / child.savingsGoal) * 100
          return (
            <Card
              key={child.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedChild?.id === child.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedChild(child)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 bg-secondary/50">
                      <AvatarFallback className="text-2xl">{child.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {child.loriCoins} LoriCoins
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs">Balance</span>
                    </div>
                    <p className="font-semibold">{formatCurrency(child.balance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <PiggyBank className="w-4 h-4" />
                      <span className="text-xs">Ahorros</span>
                    </div>
                    <p className="font-semibold">{formatCurrency(child.savings)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta de ahorro</span>
                    <span className="font-medium">{savingsProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={savingsProgress} className="h-2" />
                </div>

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

                <div className="flex gap-2">
                  <Dialog open={transferDialogOpen && selectedChildForTransfer === child.id} onOpenChange={(open) => {
                    setTransferDialogOpen(open)
                    if (!open) setSelectedChildForTransfer(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          openTransferDialog(child.id)
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Dinero
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
                        <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleTransfer} disabled={!transferAmount || Number(transferAmount) <= 0}>
                          Transferir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
