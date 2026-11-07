"use client"

import Image from "next/image"
import { Bell, Gift, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { DELIVERY_CONTACT, deliveryWhatsAppUrl } from "@/lib/loricoin/store"

export function PrizeNotifications() {
  const { redemptions, profile, children, isChildMode } = useApp()
  const nameOf = (id: string) => (isChildMode ? profile?.name : children.find((c) => c.id === id)?.name) ?? ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-amber-600" aria-hidden="true" />
          Notificaciones
        </CardTitle>
        <CardDescription>Tus premios canjeados y su entrega.</CardDescription>
      </CardHeader>
      <CardContent>
        {redemptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay premios canjeados. ¡Seguí ahorrando para tu próximo premio!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {redemptions.map((r) => {
              const delivered = r.status === "entregado"
              const name = nameOf(r.child_id)
              return (
                <li key={r.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-violet-100">
                    {r.reward_image ? (
                      <Image src={r.reward_image} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <Gift className="absolute inset-0 m-auto h-6 w-6 text-violet-700" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {isChildMode ? "¡Felicitaciones!" : `${name} canjeó un premio`}
                      </span>
                      <Badge variant={delivered ? "secondary" : "default"}>
                        {delivered ? "Entregado" : "Por entregar"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {isChildMode
                        ? `Canjeaste "${r.reward_name}". Esperamos que lo disfrutes mucho y sigas ahorrando para tu próximo premio.`
                        : `"${r.reward_name}". La entrega se coordina por WhatsApp con ${DELIVERY_CONTACT.name}.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <CoinAmount amount={r.price} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString("es-AR")}
                      </span>
                      {!delivered && isChildMode && (
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <a href={deliveryWhatsAppUrl(name, r.reward_name, r.id)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            Coordinar entrega
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
