"use client"

import { useState, type FormEvent } from "react"
import { Loader2, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorText } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { postJson } from "@/lib/loricoin/client-utils"
import { PENALTY_LIMITS } from "@/lib/loricoin/rules"

export function PenaltyForm() {
  const { children, refresh } = useApp()
  const [childId, setChildId] = useState("")
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (children.length === 0) return null

  const selectedId = childId || children[0].id
  const selected = children.find((c) => c.id === selectedId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(null)
    const value = Number(amount)
    if (!reason.trim()) return setError("Escribí el motivo.")
    if (!Number.isInteger(value) || value < 1 || value > PENALTY_LIMITS.maxAmount) {
      return setError(`El descuento tiene que ser entre 1 y ${PENALTY_LIMITS.maxAmount}.`)
    }

    setPending(true)
    try {
      const result = await postJson<{ amount: number; balance: number }>("/api/penalties", {
        childId: selectedId,
        reason,
        amount: value,
      })
      setDone(
        `Se descontaron ${result.amount} LoriCoins a ${selected?.name ?? "tu hijo"}. Saldo actual: ${result.balance}.`,
      )
      setReason("")
      setAmount("")
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Descontar LoriCoins</CardTitle>
        <CardDescription>
          Si no cumplió una tarea o algo que no está en la app, restale LoriCoins. Tu hijo lo va a ver en Movimientos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="penalty-child">Hijo o hija</Label>
              <select
                id="penalty-child"
                value={selectedId}
                onChange={(e) => setChildId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.lori_coins} LoriCoins)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="penalty-amount">LoriCoins a restar</Label>
              <Input
                id="penalty-amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={PENALTY_LIMITS.maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ej: 5"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="penalty-reason">Motivo</Label>
            <Input
              id="penalty-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={PENALTY_LIMITS.reason}
              placeholder="ej: No ordenó su pieza"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Si el descuento es mayor al saldo, se descuenta solo lo que tiene. El saldo nunca baja de 0.
          </p>
          <ErrorText message={error} />
          {done && (
            <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              {done}
            </p>
          )}
          <Button type="submit" disabled={pending} variant="destructive" className="self-start">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MinusCircle className="h-4 w-4" aria-hidden="true" />
            )}
            Descontar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
