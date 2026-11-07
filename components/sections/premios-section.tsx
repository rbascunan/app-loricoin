"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { CheckCircle2, Gift, Loader2, MessageCircle, PackageX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CoinBurst } from "@/components/loricoin/solana-ui"
import { CoinAmount, EmptyState, ErrorText } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { postJson } from "@/lib/loricoin/client-utils"
import { DELIVERY_CONTACT, STORE_CATEGORIES, categoryLabel, deliveryWhatsAppUrl } from "@/lib/loricoin/store"
import type { Reward } from "@/lib/loricoin/types"
import { cn } from "@/lib/utils"

async function fetchRewards(url: string): Promise<Reward[]> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("No se pudieron cargar los premios")
  return ((await res.json()) as { rewards: Reward[] }).rewards
}

interface RedeemSuccess {
  redemptionId: string
  rewardName: string
  price: number
}

function RewardCard({
  reward,
  balance,
  canRedeem,
  onRedeem,
}: {
  reward: Reward
  balance: number
  canRedeem: boolean
  onRedeem: (reward: Reward) => void
}) {
  const soldOut = reward.stock < 1
  const missing = Math.max(0, reward.price - balance)
  const progress = Math.min(100, Math.round((balance / reward.price) * 100))

  return (
    <Card className={cn("flex flex-col overflow-hidden", soldOut && "opacity-70")}>
      <div className="relative aspect-[4/3] bg-muted">
        {reward.image_url ? (
          <Image src={reward.image_url} alt={reward.name} fill className="object-cover" unoptimized />
        ) : (
          <Gift className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        )}
        <Badge className="absolute left-2 top-2 bg-background/90 text-foreground hover:bg-background/90">
          {categoryLabel(reward.category)}
        </Badge>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Badge variant="destructive" className="text-sm">
              Agotado
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-tight text-foreground">{reward.name}</h3>
          {reward.description && <p className="text-sm text-muted-foreground">{reward.description}</p>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <CoinAmount amount={reward.price} />
          <span className={cn("text-xs font-medium", soldOut ? "text-red-700" : "text-muted-foreground")}>
            {soldOut ? "Sin stock" : `Quedan ${reward.stock}`}
          </span>
        </div>
        {canRedeem && !soldOut && missing > 0 && (
          <div className="flex flex-col gap-1">
            <Progress value={progress} aria-label={`Llevás ${progress}% de este premio`} className="h-2" />
            <span className="text-xs text-muted-foreground">Te faltan {missing} LoriCoins</span>
          </div>
        )}
        {canRedeem && (
          <Button
            onClick={() => onRedeem(reward)}
            disabled={soldOut || missing > 0}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {soldOut ? "Agotado" : missing > 0 ? "Seguí ahorrando" : "Canjear"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function PremiosSection() {
  const { isChildMode, profile, balanceOf, refresh } = useApp()
  const { data: rewards, error, isLoading, mutate } = useSWR("/api/rewards", fetchRewards, { refreshInterval: 20000 })
  const [category, setCategory] = useState<string>("todos")
  const [selected, setSelected] = useState<Reward | null>(null)
  const [pending, setPending] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [success, setSuccess] = useState<RedeemSuccess | null>(null)

  const balance = isChildMode ? balanceOf(profile?.id, profile?.lori_coins ?? 0) : 0
  const visible = (rewards ?? []).filter((r) => category === "todos" || r.category === category)
  const availableCategories = STORE_CATEGORIES.filter(
    (c) => c.id === "todos" || (rewards ?? []).some((r) => r.category === c.id),
  )

  const closeDialog = () => {
    if (pending) return
    setSelected(null)
    setSuccess(null)
    setRedeemError(null)
  }

  const confirmRedeem = async () => {
    if (!selected) return
    setPending(true)
    setRedeemError(null)
    try {
      const result = await postJson<RedeemSuccess>("/api/redemptions", { rewardId: selected.id })
      setSuccess(result)
      await Promise.all([mutate(), refresh()])
    } catch (e) {
      setRedeemError((e as Error).message)
      await mutate()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tienda de premios</h1>
          <p className="text-muted-foreground">
            {isChildMode
              ? "Canjeá las LoriCoins que ahorraste por premios reales."
              : "Lo que tus hijos pueden conseguir con sus LoriCoins. Solo ellos pueden canjear."}
          </p>
        </div>
        {isChildMode && (
          <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2">
            <span className="text-sm text-amber-900">Tenés</span>
            <CoinAmount amount={balance} />
          </div>
        )}
      </header>

      <div role="group" aria-label="Filtrar por categoría" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {availableCategories.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={category === c.id ? "default" : "outline"}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn("shrink-0 rounded-full", category === c.id && "bg-emerald-600 text-white hover:bg-emerald-700")}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Cargando premios" />
        </div>
      ) : error ? (
        <ErrorText message={(error as Error).message} />
      ) : visible.length === 0 ? (
        <EmptyState title="No hay premios acá" description="Probá con otra categoría." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              balance={balance}
              canRedeem={isChildMode}
              onRedeem={(r) => {
                setSuccess(null)
                setRedeemError(null)
                setSelected(r)
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <CoinBurst show={success !== null} />
          {success ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  ¡Felicitaciones!
                </DialogTitle>
                <DialogDescription>
                  Canjeaste <strong className="text-foreground">{success.rewardName}</strong> por {success.price}{" "}
                  LoriCoins. Para recibir tu premio, coordiná la entrega por WhatsApp con {DELIVERY_CONTACT.name} al{" "}
                  {DELIVERY_CONTACT.display}.
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                Esperamos que disfrutes tu premio. ¡Seguí ahorrando para el próximo!
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeDialog}>
                  Cerrar
                </Button>
                <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                  <a
                    href={deliveryWhatsAppUrl(profile?.name ?? "", success.rewardName, success.redemptionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Coordinar por WhatsApp
                    <span className="sr-only">(se abre en otra pestaña)</span>
                  </a>
                </Button>
              </DialogFooter>
            </>
          ) : selected ? (
            <>
              <DialogHeader>
                <DialogTitle>¿Canjear {selected.name}?</DialogTitle>
                <DialogDescription>
                  Se van a descontar {selected.price} LoriCoins de tu billetera. Te quedarían{" "}
                  {Math.max(0, balance - selected.price)}.
                </DialogDescription>
              </DialogHeader>
              {selected.image_url && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image src={selected.image_url} alt={selected.name} fill className="object-cover" unoptimized />
                </div>
              )}
              {redeemError && (
                <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
                  <PackageX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {redeemError}
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeDialog} disabled={pending}>
                  Mejor no
                </Button>
                <Button onClick={confirmRedeem} disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {pending ? "Canjeando..." : "Sí, canjear"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
