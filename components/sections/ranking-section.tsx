"use client"

import useSWR from "swr"
import { Loader2, Medal, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { CoinAmount, EmptyState } from "@/components/loricoin/task-ui"
import { initials } from "@/lib/loricoin/client-utils"
import { RANKING_PRIZE, RANKING_WINNERS } from "@/lib/loricoin/goals"
import type { RankingResponse } from "@/lib/loricoin/types"
import { cn } from "@/lib/utils"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("No pudimos cargar el ranking")
  return (await res.json()) as RankingResponse
}

const PODIUM = ["bg-yellow-100 text-yellow-800", "bg-slate-100 text-slate-700", "bg-orange-100 text-orange-800"]

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

export function RankingSection() {
  const { data, error, isLoading } = useSWR("/api/ranking", fetcher, { refreshInterval: 30000 })

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Ranking de ahorro</h1>
        <p className="text-muted-foreground">
          {`Los ${RANKING_WINNERS} chicos que más LoriCoins ahorren en la semana ganan ${RANKING_PRIZE} LoriCoins.`}
        </p>
      </header>

      <Card className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
        <CardContent className="flex items-center gap-3 p-4">
          <Trophy className="h-8 w-8 shrink-0" aria-hidden="true" />
          <div className="flex min-w-0 flex-col">
            <span className="font-semibold">
              {data ? `Semana del ${formatDay(data.weekStart)} al ${formatDay(data.weekEnd)}` : "Semana actual"}
            </span>
            <span className="text-sm text-white/90">
              Ahorrado = LoriCoins ganadas menos descuentos y canjes. Se premia al cerrar el domingo.
            </span>
          </div>
        </CardContent>
      </Card>

      {data && data.lastWinners.length > 0 && (
        <section aria-labelledby="last-winners" className="flex flex-col gap-2">
          <h2 id="last-winners" className="text-sm font-semibold text-muted-foreground">
            Ganadores de la semana pasada
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.lastWinners.map((w, i) => (
              <span
                key={w.childId}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", PODIUM[i])}
              >
                <Medal className="h-4 w-4" aria-hidden="true" />
                {w.name}
                {w.isMe && " (vos)"}
              </span>
            ))}
          </div>
        </section>
      )}

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
        <Card>
          <CardContent className="p-0">
            <ol className="divide-y">
              {data.entries.map((e, i) => (
                <li
                  key={e.childId}
                  className={cn("flex items-center gap-3 p-3 md:p-4", e.isMe && "bg-emerald-50/70")}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      i < RANKING_WINNERS && e.saved > 0 ? PODIUM[i] : "bg-muted text-muted-foreground",
                    )}
                    aria-label={`Puesto ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                  <Avatar className="h-9 w-9">
                    {e.avatar && <AvatarImage src={e.avatar} alt="" />}
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">{initials(e.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {e.name}
                    {e.isMe && <span className="ml-1 text-xs text-emerald-700">(tu familia)</span>}
                  </span>
                  <span className={cn("flex items-center gap-0.5", e.saved < 0 ? "text-red-700" : "text-foreground")}>
                    {e.saved < 0 && "-"}
                    <CoinAmount amount={Math.abs(e.saved)} />
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
