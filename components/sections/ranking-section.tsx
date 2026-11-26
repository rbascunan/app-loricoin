"use client"

import useSWR from "swr"
import { Crown, Flame, Loader2, Medal, Sparkles, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { CoinAmount, EmptyState } from "@/components/loricoin/task-ui"
import { initials } from "@/lib/loricoin/client-utils"
import { RANKING_PRIZE, RANKING_WINNERS } from "@/lib/loricoin/goals"
import type { RankingEntry, RankingResponse } from "@/lib/loricoin/types"
import { cn } from "@/lib/utils"

const LIST_SIZE = 10

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("No pudimos cargar el ranking")
  return (await res.json()) as RankingResponse
}

const PLACE_STYLE = [
  {
    ring: "ring-yellow-400",
    block: "h-28 md:h-32 bg-gradient-to-b from-yellow-300 to-amber-400 text-amber-800",
    badge: "bg-yellow-400 text-amber-900",
    avatar: "h-20 w-20 md:h-24 md:w-24",
  },
  {
    ring: "ring-slate-300",
    block: "h-20 md:h-24 bg-gradient-to-b from-slate-200 to-slate-300 text-slate-600",
    badge: "bg-slate-300 text-slate-800",
    avatar: "h-16 w-16 md:h-20 md:w-20",
  },
  {
    ring: "ring-orange-300",
    block: "h-16 md:h-20 bg-gradient-to-b from-orange-200 to-orange-300 text-orange-800",
    badge: "bg-orange-300 text-orange-900",
    avatar: "h-16 w-16 md:h-20 md:w-20",
  },
]

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

function shortName(name: string) {
  const [first, last] = name.trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

function Saved({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5 font-semibold", value < 0 ? "text-red-700" : "text-foreground", className)}>
      {value < 0 && "-"}
      <CoinAmount amount={Math.abs(value)} />
    </span>
  )
}

function PodiumSpot({ entry, place }: { entry?: RankingEntry; place: number }) {
  const style = PLACE_STYLE[place]
  const PlaceIcon = place === 0 ? Crown : Medal

  return (
    <li className={cn("flex w-1/3 max-w-40 flex-col items-center", place === 0 ? "order-2" : place === 1 ? "order-1" : "order-3")}>
      <div className="relative flex flex-col items-center gap-1 pb-2">
        {place === 0 && entry && (
          <Crown className="absolute -top-6 h-7 w-7 animate-bounce fill-yellow-300 text-yellow-500" aria-hidden="true" />
        )}
        <Avatar className={cn("ring-4 ring-offset-2 ring-offset-background", style.avatar, style.ring, !entry && "opacity-40")}>
          {entry?.avatar && <AvatarImage src={entry.avatar} alt="" className="object-cover" />}
          <AvatarFallback className="bg-emerald-100 text-lg font-bold text-emerald-700">
            {entry ? initials(entry.name) : "?"}
          </AvatarFallback>
        </Avatar>
        <span className={cn("-mt-3 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm", style.badge)}>{place + 1}°</span>
        <span className="max-w-full truncate text-center text-sm font-bold text-foreground">
          {entry ? shortName(entry.name) : "¡Libre!"}
          {entry?.isMe && <span className="sr-only"> (tu familia)</span>}
        </span>
        {entry ? <Saved value={entry.saved} className="text-xs" /> : <span className="text-xs text-muted-foreground">Esperando</span>}
      </div>
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-2xl pt-3 shadow-inner",
          style.block,
          entry?.isMe && "outline outline-2 outline-offset-2 outline-emerald-500",
        )}
      >
        <PlaceIcon className="h-7 w-7 md:h-8 md:w-8" aria-hidden="true" />
      </div>
    </li>
  )
}

function Podium({ entries }: { entries: RankingEntry[] }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-b from-emerald-50 via-teal-50 to-background">
      <CardContent className="flex flex-col gap-6 p-4 pt-5 md:p-6">
        <h2 className="flex items-center gap-2 font-bold text-foreground">
          <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Top Ahorradores de la Semana
        </h2>
        <ol className="flex items-end justify-center gap-2 pt-6 md:gap-4" aria-label="Podio de la semana">
          {[0, 1, 2].map((place) => (
            <PodiumSpot key={place} place={place} entry={entries[place]} />
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

function ChaseList({ podium, others }: { podium: RankingEntry[]; others: RankingEntry[] }) {
  const leaderSaved = podium[0]?.saved ?? 0
  const chasers = others.slice(0, LIST_SIZE)
  if (chasers.length === 0) return null
  const thirdSaved = podium.length === RANKING_WINNERS ? podium[RANKING_WINNERS - 1].saved : 0

  return (
    <section aria-labelledby="chasers" className="flex flex-col gap-2">
      <h2 id="chasers" className="flex items-center gap-2 font-bold text-foreground">
        <Flame className="h-5 w-5 text-orange-500" aria-hidden="true" />
        ¡A la caza del podio!
      </h2>
      <ol className="flex flex-col gap-2" start={podium.length + 1}>
        {chasers.map((e, i) => {
          const position = podium.length + 1 + i
          const missing = Math.max(0, thirdSaved - e.saved + 1)
          const bar = leaderSaved > 0 ? Math.max(6, Math.min(100, Math.round((Math.max(0, e.saved) / leaderSaved) * 100))) : 6
          return (
            <li
              key={e.childId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-transform hover:-translate-y-0.5",
                e.isMe && "border-emerald-400 bg-emerald-50",
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-extrabold text-teal-800"
                aria-label={`Puesto ${position}`}
              >
                {position}
              </span>
              <Avatar className="h-10 w-10 ring-2 ring-teal-200">
                {e.avatar && <AvatarImage src={e.avatar} alt="" className="object-cover" />}
                <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">{initials(e.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-semibold text-foreground">
                  {shortName(e.name)}
                  {e.isMe && <span className="ml-1 text-xs font-medium text-emerald-700">(tu familia)</span>}
                </span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${bar}%` }} />
                </div>
                {missing > 0 && thirdSaved > 0 && (
                  <span className="text-xs text-muted-foreground">{`Le faltan ${missing} LC para el podio`}</span>
                )}
              </div>
              <Saved value={e.saved} className="text-sm" />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function RankingSection() {
  const { data, error, isLoading } = useSWR("/api/ranking", fetcher, { refreshInterval: 30000 })
  const podium = data?.entries.filter((e) => e.saved > 0).slice(0, RANKING_WINNERS) ?? []
  const others = data?.entries.filter((e) => !podium.includes(e)) ?? []

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Ranking de ahorro</h1>
        <p className="text-muted-foreground">
          {`Los ${RANKING_WINNERS} chicos que más LoriCoins ahorren en la semana ganan ${RANKING_PRIZE} LoriCoins.`}
        </p>
      </header>

      <Card className="border-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
        <CardContent className="flex items-center gap-3 p-4">
          <Sparkles className="h-8 w-8 shrink-0" aria-hidden="true" />
          <div className="flex min-w-0 flex-col">
            <span className="font-semibold">
              {data ? `Semana del ${formatDay(data.weekStart)} al ${formatDay(data.weekEnd)}` : "Semana actual"}
            </span>
            <span className="text-sm text-white/90">
              {`Premio: +${RANKING_PRIZE} LC para el podio. Ahorrado = ganadas menos descuentos y canjes. Cierra el domingo.`}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Cargando ranking" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error.message}
        </p>
      ) : !data || data.entries.length === 0 ? (
        <EmptyState title="Todavía no hay chicos en el ranking" description="Cuando ahorren LoriCoins van a aparecer acá." />
      ) : (
        <>
          <Podium entries={podium} />
          <ChaseList podium={podium} others={others} />
        </>
      )}

      {data && data.lastWinners.length > 0 && (
        <section aria-labelledby="last-winners" className="flex flex-col gap-2">
          <h2 id="last-winners" className="text-sm font-semibold text-muted-foreground">
            Ganadores de la semana pasada
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.lastWinners.map((w, i) => (
              <span
                key={w.childId}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", PLACE_STYLE[i]?.badge)}
              >
                <Medal className="h-4 w-4" aria-hidden="true" />
                {w.name}
                {w.isMe && " (vos)"}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
