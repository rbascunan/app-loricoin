"use client"

import Image from "next/image"
import { Blocks, ListChecks } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComingSoonBadge } from "@/components/coming-soon"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"

export function LoriCoinsSection() {
  const { isChildMode, profile, children } = useApp()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">LoriCoins</h1>
        <p className="text-muted-foreground">La moneda que se gana con esfuerzo.</p>
      </header>

      <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-100">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative h-20 w-20 shrink-0">
            <Image src={LORICOIN_IMAGES.treasure} alt="" fill className="object-contain" unoptimized />
          </div>
          {isChildMode ? (
            <div>
              <p className="text-sm text-amber-900">Tenés</p>
              <CoinAmount amount={profile?.lori_coins ?? 0} size="lg" className="text-4xl" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-sm text-amber-900">LoriCoins de tus hijos</p>
              {children.length === 0 ? (
                <p className="text-sm text-amber-900">Todavía no agregaste hijos.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {children.map((child) => (
                    <li key={child.id} className="flex items-center justify-between gap-4">
                      <span className="font-medium text-foreground">{child.name}</span>
                      <CoinAmount amount={child.lori_coins} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Cómo se ganan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            El papá o la mamá crea una tarea con una recompensa de 1 a 50 LoriCoins. Cuando el hijo la termina y el
            adulto la aprueba, las LoriCoins se acreditan.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Blocks className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              LoriCoins en Solana
              <ComingSoonBadge />
            </CardTitle>
            <CardDescription>
              Las LoriCoins se van a registrar como token en la red Solana. Por ahora se guardan en LoriCoin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
