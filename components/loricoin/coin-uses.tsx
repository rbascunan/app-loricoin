"use client"

import Image from "next/image"
import { Gift, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const EXAMPLES = [
  { image: "/images/premios/viaje.png", label: "Un viaje en familia" },
  { image: "/images/premios/cine.png", label: "Una entrada al cine" },
  { image: "/images/premios/drone.png", label: "Un drone" },
  { image: "/images/premios/pelota.png", label: "Una pelota de fútbol" },
]

export function CoinUses({ onGoToStore }: { onGoToStore?: () => void }) {
  return (
    <section aria-labelledby="coin-uses-title" className="flex flex-col gap-4">
      <h2 id="coin-uses-title" className="text-lg font-semibold text-foreground">
        ¿Qué podés hacer con tus LoriCoins?
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/9] bg-emerald-50">
            <Image src="/images/premios/ahorro.png" alt="Alcancía con monedas" fill className="object-cover" unoptimized />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Ahorrar
            </CardTitle>
            <CardDescription className="text-pretty">
              Guardá tus LoriCoins y miralas crecer. Cuanto más ahorrás, más grandes son los premios que podés
              conseguir. ¡Ahorrar es elegir algo mejor para después!
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Canjear por premios
            </CardTitle>
            <CardDescription>En la Tienda podés cambiar tus LoriCoins por cosas como:</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="grid grid-cols-2 gap-3">
              {EXAMPLES.map((ex) => (
                <li key={ex.label} className="flex flex-col gap-1">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={ex.image} alt={ex.label} fill className="object-cover" unoptimized />
                  </div>
                  <span className="text-xs font-medium text-foreground">{ex.label}</span>
                </li>
              ))}
            </ul>
            {onGoToStore && (
              <Button onClick={onGoToStore} className="mt-auto">
                Ir a la Tienda
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
