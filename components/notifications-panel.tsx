"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, Trophy, Coins, Star, Target } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const iconMap: Record<string, React.ElementType> = {
  '🏆': Trophy,
  '🪙': Coins,
  '⭐': Star,
  '🎯': Target,
  '🌟': Star,
}

export function NotificationsPanel() {
  const { notifications, markNotificationRead, unreadCount } = useApp()

  const getIcon = (icon: string) => {
    const IconComponent = iconMap[icon]
    if (IconComponent) {
      return <IconComponent className="w-5 h-5" />
    }
    return <span className="text-lg">{icon}</span>
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return "hace un momento"
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notificaciones</h4>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} sin leer
              </span>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        notification.type === "achievement"
                          ? "bg-accent/20 text-accent"
                          : notification.type === "podium"
                          ? "bg-primary/20 text-primary"
                          : notification.type === "loricoins"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getIcon(notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <Check className="w-3 h-3 mr-1" />
              Marcar todas como leidas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
