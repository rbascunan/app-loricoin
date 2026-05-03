"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  Filter,
  Download,
  Coins,
  Calendar,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

export function MovementsSection() {
  const { transactions, isChildMode, addTransaction, selectedChild, addLoriCoins } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  
  // Manual transaction form
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualType, setManualType] = useState<"income" | "expense">("income")
  const [manualAmount, setManualAmount] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [manualCategory, setManualCategory] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const handleManualTransaction = () => {
    if (manualAmount && manualDescription && manualCategory) {
      addTransaction({
        id: Date.now().toString(),
        type: manualType,
        amount: Number(manualAmount),
        description: manualDescription,
        category: manualCategory,
        date: new Date().toISOString(),
        loriCoins: manualType === "income" ? 5 : 0, // Earn LC for logging income
      })
      
      // Award LoriCoins for tracking expenses
      if (selectedChild && manualType === "expense") {
        addLoriCoins(selectedChild.id, 10, "Registraste un gasto manualmente")
      }
      
      setManualAmount("")
      setManualDescription("")
      setManualCategory("")
      setManualDialogOpen(false)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesCategory = filterCategory === "all" || tx.category === filterCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const categories = [...new Set(transactions.map((tx) => tx.category))]

  const totalIncome = transactions
    .filter((tx) => tx.type === "income" || tx.type === "reward")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalSavings = transactions
    .filter((tx) => tx.type === "transfer" && tx.to === "Cuenta de Ahorro")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const incomeCategories = ["Mesada", "Regalo", "Cumpleanos", "Trabajo", "Venta", "Otro"]
  const expenseCategories = ["Golosinas", "Juguetes", "Escuela", "Transporte", "Comida", "Entretenimiento", "Ropa", "Otro"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <Image 
              src="/images/loricoin-mascot.png" 
              alt="Movimientos" 
              width={36} 
              height={36}
              className="w-9 h-9"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Movimientos</h1>
            <p className="text-muted-foreground">
              {isChildMode
                ? "Revisa todos tus ingresos y gastos"
                : "Historial de transacciones de la familia"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Manual Transaction Buttons - for Child Mode */}
          {isChildMode && (
            <>
              <Dialog open={manualDialogOpen && manualType === "income"} onOpenChange={(open) => {
                setManualDialogOpen(open)
                if (open) setManualType("income")
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Ingreso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                      Registrar Ingreso
                    </DialogTitle>
                    <DialogDescription>
                      Anota el dinero que recibiste (mesada, regalo, etc.)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Cuanto recibiste?</Label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>De donde viene?</Label>
                      <Select value={manualCategory} onValueChange={setManualCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {incomeCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripcion</Label>
                      <Input
                        placeholder="Ej: Mesada de la semana"
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">Ganaras +5 LoriCoins por registrar!</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleManualTransaction}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={!manualAmount || !manualDescription || !manualCategory}
                    >
                      Guardar Ingreso
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={manualDialogOpen && manualType === "expense"} onOpenChange={(open) => {
                setManualDialogOpen(open)
                if (open) setManualType("expense")
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <Minus className="w-4 h-4 mr-2" />
                    Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                      Registrar Gasto
                    </DialogTitle>
                    <DialogDescription>
                      Anota en que gastaste tu dinero
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Cuanto gastaste?</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>En que lo gastaste?</Label>
                      <Select value={manualCategory} onValueChange={setManualCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripcion</Label>
                      <Input
                        placeholder="Ej: Golosinas en el kiosco"
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">Ganaras +10 LoriCoins por llevar registro de tus gastos!</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleManualTransaction}
                      variant="destructive"
                      disabled={!manualAmount || !manualDescription || !manualCategory}
                    >
                      Guardar Gasto
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Ingresos</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Gastos</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Ahorrado</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalSavings)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
                <SelectItem value="transfer">Transferencias</SelectItem>
                <SelectItem value="reward">Recompensas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            {filteredTransactions.length} movimientos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
                    <p className="font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {tx.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    {(tx.from || tx.to) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tx.from && `De: ${tx.from}`}
                        {tx.from && tx.to && " -> "}
                        {tx.to && `Para: ${tx.to}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
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
                    <p className="text-xs text-yellow-600 font-medium flex items-center justify-end gap-1">
                      <Coins className="w-3 h-3" />+{tx.loriCoins} LC
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
