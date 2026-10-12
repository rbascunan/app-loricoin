import Image from "next/image"
import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { formatDate } from "@/lib/loricoin/client-utils"
import type { Task, TaskStatus } from "@/lib/loricoin/types"

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-sky-100 text-sky-800" },
  terminada: { label: "Terminada", className: "bg-yellow-100 text-yellow-800" },
  pagando: { label: "Pagando en Solana…", className: "bg-violet-100 text-violet-800" },
  pagada: { label: "Pagada", className: "bg-emerald-100 text-emerald-800" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-800" },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", style.className)}>{style.label}</span>
  )
}

export function CoinAmount({
  amount,
  className,
  size = "sm",
}: {
  amount: number
  className?: string
  size?: "sm" | "lg"
}) {
  const px = size === "lg" ? 40 : 20
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-bold text-amber-600", className)}>
      <Image
        src={LORICOIN_IMAGES.coin}
        alt=""
        width={px}
        height={px}
        className={size === "lg" ? "h-10 w-10" : "h-5 w-5"}
        unoptimized
      />
      <span>{amount}</span>
      <span className="sr-only">LoriCoins</span>
    </span>
  )
}

export function TaskCard({
  task,
  childName,
  footer,
  children,
}: {
  task: Task
  childName?: string
  footer?: ReactNode
  children?: ReactNode
}) {
  const dateLabel =
    task.status === "pendiente"
      ? `Creada ${formatDate(task.created_at)}`
      : task.status === "terminada"
        ? `Terminada ${formatDate(task.done_at)}`
        : `Resuelta ${formatDate(task.resolved_at)}`

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-pretty font-semibold text-foreground">{task.title}</h3>
            {task.description && <p className="text-pretty text-sm text-muted-foreground">{task.description}</p>}
            <p className="text-xs text-muted-foreground">
              {childName ? `${childName} · ` : ""}
              {dateLabel}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CoinAmount amount={task.reward} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
        {children}
        {footer && <div className="flex flex-wrap items-center gap-2">{footer}</div>}
      </CardContent>
    </Card>
  )
}

export function TaskGroup({
  title,
  description,
  count,
  children,
}: {
  title: string
  description?: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">({count})</span>
      </div>
      {description && <p className="-mt-2 text-sm text-muted-foreground">{description}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="relative h-20 w-20">
          <Image src={LORICOIN_IMAGES.coin} alt="" fill className="object-contain" unoptimized />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">{description}</p>
        {action}
      </CardContent>
    </Card>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  )
}
