"use client"

import Image from "next/image"
import { Blocks, ListChecks } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChainFallbackNotice, WalletAddress } from "@/components/loricoin/solana-ui"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { CoinUses } from "@/components/loricoin/coin-uses"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"

export function LoriCoinsSection({ onGoToStore }: { onGoToStore?: () => void }) {
  const { isChildMode, profile, children, wallet, balanceOf } = useApp()
  const addressOf = (childId: string | undefined) =>
    wallet?.balances.find((b) => b.childId === childId)?.address ?? null
  const myAddress = addressOf(profile?.id)

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
            <div className="flex flex-col gap-2">
              <p className="text-sm text-amber-900">Tenés</p>
              <CoinAmount amount={balanceOf(profile?.id, profile?.lori_coins ?? 0)} size="lg" className="text-4xl" />
              {myAddress ? (
                <div>
                  <p className="text-xs text-amber-900">Tu billetera</p>
                  <WalletAddress address={myAddress} />
                </div>
              ) : (
                <p className="text-xs text-amber-900">Tu billetera se crea con tu primer pago.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-sm text-amber-900">LoriCoins de tus hijos</p>
              {children.length === 0 ? (
                <p className="text-sm text-amber-900">Todavía no agregaste hijos.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {children.map((child) => {
                    const address = addressOf(child.id)
                    return (
                      <li key={child.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-foreground">{child.name}</span>
                          <CoinAmount amount={balanceOf(child.id, child.lori_coins)} />
                        </div>
                        {address && <WalletAddress address={address} />}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ChainFallbackNotice show={wallet !== null && !wallet.chainOk} />

      <CoinUses onGoToStore={onGoToStore} />

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
            adulto la aprueba, las LoriCoins llegan a su billetera. Si no cumple algo, el adulto puede descontar.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Blocks className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Cómo funciona LoriCoin en Solana
            </CardTitle>
            <CardDescription>
              Cada LoriCoin es un token real en la red de pruebas de Solana (devnet). Al aprobar una tarea se crean
              monedas nuevas en la billetera del hijo; al descontar, se queman. Todo queda registrado y se puede ver en
              Solana Explorer. Es una red de pruebas: las monedas no tienen valor en dinero.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
