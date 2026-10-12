import Image from "next/image"
import { Bell, Gift, Nfc, PiggyBank, Send, Trophy, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import type { SectionId } from "@/lib/navigation"

type FeatureId = "premios" | "ranking" | "ahorros" | "enviar" | "alertas" | "nfc"

interface Feature {
  id: FeatureId
  title: string
  description: string
  icon: LucideIcon
  section?: SectionId
}

const FEATURES: Feature[] = [
  {
    id: "premios",
    title: "Premios y tienda",
    description: "Canjeá tus LoriCoins por premios que elija tu familia.",
    icon: Gift,
    section: "premios",
  },
  {
    id: "ranking",
    title: "Ranking",
    description: "Compará tu progreso con amigos y familia.",
    icon: Trophy,
    section: "ranking",
  },
  {
    id: "ahorros",
    title: "Ahorros y metas",
    description: "Armá metas y seguí cuánto te falta para alcanzarlas.",
    icon: PiggyBank,
  },
  {
    id: "enviar",
    title: "Enviar dinero",
    description: "Mandá la mesada y transferencias dentro de la familia.",
    icon: Send,
  },
  {
    id: "alertas",
    title: "Alertas",
    description: "Avisos cuando hay tareas nuevas o recompensas acreditadas.",
    icon: Bell,
  },
  {
    id: "nfc",
    title: "Anillo NFC",
    description: "Pagá y sumá LoriCoins acercando tu anillo.",
    icon: Nfc,
  },
]

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800",
        className,
      )}
    >
      Próximamente
    </span>
  )
}

export function ComingSoonSection({ featureId }: { featureId: FeatureId }) {
  const feature = FEATURES.find((f) => f.id === featureId)!
  const Icon = feature.icon
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
      <div className="relative h-32 w-32">
        <Image src={LORICOIN_IMAGES.shopping} alt="" fill className="object-contain" unoptimized />
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">{feature.title}</h1>
      </div>
      <ComingSoonBadge />
      <p className="text-pretty text-muted-foreground">{feature.description}</p>
      <p className="text-sm text-muted-foreground">
        Estamos trabajando en esta función. Por ahora podés ganar LoriCoins con las tareas.
      </p>
    </div>
  )
}

export function ComingSoonGrid({ onNavigate }: { onNavigate?: (section: SectionId) => void }) {
  return (
    <section aria-labelledby="coming-soon-title" className="flex flex-col gap-3">
      <h2 id="coming-soon-title" className="text-lg font-semibold text-foreground">
        Lo que viene
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          const inner = (
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{feature.title}</span>
                  <ComingSoonBadge />
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </CardContent>
          )
          return feature.section && onNavigate ? (
            <Card key={feature.id} className="transition-colors hover:bg-emerald-50/50">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onNavigate(feature.section!)}
              >
                {inner}
              </button>
            </Card>
          ) : (
            <Card key={feature.id} className="opacity-90">
              {inner}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
