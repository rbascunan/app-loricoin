"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ComingSoonGrid } from "@/components/coming-soon"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import type { SectionId } from "@/lib/navigation"

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </CardContent>
    </Card>
  )
}

export function DashboardSection({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const { profile, children, tasks, isChildMode } = useApp()
  const firstName = profile?.name.split(" ")[0] ?? ""

  const toReview = tasks.filter((t) => t.status === "terminada").length
  const pending = tasks.filter((t) => t.status === "pendiente").length
  const paidTotal = tasks.filter((t) => t.status === "pagada").reduce((sum, t) => sum + t.reward, 0)

  const callout = isChildMode
    ? pending > 0
      ? `Tenés ${pending} ${pending === 1 ? "tarea para hacer" : "tareas para hacer"}.`
      : "No tenés tareas pendientes. ¡Bien!"
    : children.length === 0
      ? "Empezá creando la cuenta de tu hijo o hija."
      : toReview > 0
        ? `Tenés ${toReview} ${toReview === 1 ? "tarea para revisar" : "tareas para revisar"}.`
        : "No hay tareas esperando tu aprobación."

  const cta = !isChildMode && children.length === 0 ? { label: "Ir a Familia", to: "family" as const } : { label: "Ver tareas", to: "tasks" as const }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative hidden h-24 w-24 shrink-0 sm:block">
            <Image src={LORICOIN_IMAGES.coin} alt="" fill className="object-contain" unoptimized />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <h1 className="text-balance text-2xl font-bold">Hola, {firstName}</h1>
            <p className="text-white/90">{callout}</p>
            <Button
              variant="secondary"
              size="sm"
              className="self-start bg-white text-emerald-700 hover:bg-white/90"
              onClick={() => onNavigate(cta.to)}
            >
              {cta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isChildMode ? (
          <>
            <Stat label="Tus LoriCoins" value={<CoinAmount amount={profile?.lori_coins ?? 0} className="text-2xl" />} />
            <Stat label="Para hacer" value={pending} />
            <Stat label="Esperando aprobación" value={toReview} />
          </>
        ) : (
          <>
            <Stat label="Hijos" value={children.length} />
            <Stat label="Para revisar" value={toReview} />
            <Stat label="LoriCoins pagadas" value={<CoinAmount amount={paidTotal} className="text-2xl" />} />
          </>
        )}
      </div>

      <ComingSoonGrid onNavigate={onNavigate} />
    </div>
  )
}
