"use client"

import { useState, type FormEvent } from "react"
import { Check, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CoinAmount, EmptyState, ErrorText, TaskCard, TaskGroup } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { postJson } from "@/lib/loricoin/client-utils"
import { LIMITS, MAX_REWARD, MIN_REWARD } from "@/lib/loricoin/rules"
import type { Task } from "@/lib/loricoin/types"
import type { SectionId } from "@/lib/navigation"

function useTaskAction() {
  const { refresh } = useApp()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (taskId: string, action: "complete" | "approve" | "reject", body?: unknown) => {
    if (busyId) return
    setBusyId(taskId)
    setError(null)
    try {
      await postJson(`/api/tasks/${taskId}/${action}`, body)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      await refresh()
      setBusyId(null)
    }
  }

  return { busyId, error, run }
}

function CreateTaskForm() {
  const { children, refresh } = useApp()
  const [childId, setChildId] = useState(children.length === 1 ? children[0]!.id : "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState("10")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const rewardNumber = Number(reward)
    if (!childId) return setError("Elegí a qué hijo le asignás la tarea.")
    if (!title.trim()) return setError("Escribí un título para la tarea.")
    if (!Number.isInteger(rewardNumber) || rewardNumber < MIN_REWARD || rewardNumber > MAX_REWARD) {
      return setError(`La recompensa tiene que ser un número entero entre ${MIN_REWARD} y ${MAX_REWARD}.`)
    }

    setPending(true)
    try {
      await postJson("/api/tasks", { childId, title, description, reward: rewardNumber })
      setTitle("")
      setDescription("")
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Nueva tarea</CardTitle>
        <CardDescription>Cuando tu hijo la termine, la aprobás y recibe las LoriCoins.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-child">Para</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger id="task-child" className="w-full">
                  <SelectValue placeholder="Elegí un hijo" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-reward">Recompensa (LoriCoins)</Label>
              <Input
                id="task-reward"
                type="number"
                inputMode="numeric"
                min={MIN_REWARD}
                max={MAX_REWARD}
                step={1}
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.taskTitle}
              placeholder="Ordenar la habitación"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-description">Descripción (opcional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={LIMITS.taskDescription}
              rows={2}
            />
          </div>
          <ErrorText message={error} />
          <Button type="submit" disabled={pending} className="self-start bg-emerald-600 text-white hover:bg-emerald-700">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            Crear tarea
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ReviewActions({
  task,
  busy,
  onApprove,
  onReject,
}: {
  task: Task
  busy: boolean
  onApprove: () => void
  onReject: (note: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState("")

  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor={`note-${task.id}`}>¿Por qué la rechazás? (opcional)</Label>
        <Textarea
          id={`note-${task.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LIMITS.rejectionNote}
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => onReject(note)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Confirmar rechazo
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRejecting(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" disabled={busy} onClick={onApprove} className="bg-emerald-600 text-white hover:bg-emerald-700">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        Aprobar y pagar
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(true)}>
        <X className="h-4 w-4" aria-hidden="true" />
        Rechazar
      </Button>
    </>
  )
}

function ParentTasks({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const { children, tasks } = useApp()
  const { busyId, error, run } = useTaskAction()
  const childName = (id: string) => children.find((c) => c.id === id)?.name ?? "Hijo"

  if (children.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay hijos en tu familia"
        description="Primero creá la cuenta de tu hijo o hija. Después vas a poder asignarle tareas."
        action={
          <Button onClick={() => onNavigate("family")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            Ir a Familia
          </Button>
        }
      />
    )
  }

  const byStatus = (status: Task["status"]) => tasks.filter((t) => t.status === status)
  const toReview = byStatus("terminada")
  const pending = byStatus("pendiente")
  const resolved = tasks.filter((t) => t.status === "pagada" || t.status === "rechazada")

  return (
    <div className="flex flex-col gap-6">
      <CreateTaskForm />
      <ErrorText message={error} />
      <TaskGroup title="Para revisar" description="Tu hijo dice que las terminó." count={toReview.length}>
        {toReview.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas esperando tu aprobación.</p>
        ) : (
          toReview.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              childName={childName(task.child_id)}
              footer={
                <ReviewActions
                  task={task}
                  busy={busyId === task.id}
                  onApprove={() => run(task.id, "approve")}
                  onReject={(note) => run(task.id, "reject", { note })}
                />
              }
            />
          ))
        )}
      </TaskGroup>
      <TaskGroup title="Pendientes" count={pending.length}>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
        ) : (
          pending.map((task) => <TaskCard key={task.id} task={task} childName={childName(task.child_id)} />)
        )}
      </TaskGroup>
      {resolved.length > 0 && (
        <TaskGroup title="Resueltas" count={resolved.length}>
          {resolved.map((task) => (
            <TaskCard key={task.id} task={task} childName={childName(task.child_id)}>
              {task.status === "rechazada" && task.rejection_note && (
                <p className="text-sm text-muted-foreground">Nota: {task.rejection_note}</p>
              )}
            </TaskCard>
          ))}
        </TaskGroup>
      )}
    </div>
  )
}

function ChildTasks() {
  const { tasks, profile } = useApp()
  const { busyId, error, run } = useTaskAction()

  const pending = tasks.filter((t) => t.status === "pendiente")
  const waiting = tasks.filter((t) => t.status === "terminada")
  const rejected = tasks.filter((t) => t.status === "rechazada")
  const paid = tasks.filter((t) => t.status === "pagada")

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-white/90">Tus LoriCoins</p>
            <p className="text-3xl font-bold">{profile?.lori_coins ?? 0}</p>
          </div>
          <p className="max-w-[12rem] text-right text-sm text-white/90">Terminá tus tareas para ganar más.</p>
        </CardContent>
      </Card>
      <ErrorText message={error} />
      {tasks.length === 0 && (
        <EmptyState
          title="Todavía no tenés tareas"
          description="Cuando tu papá o mamá te asigne una, la vas a ver acá."
        />
      )}
      {pending.length > 0 && (
        <TaskGroup title="Para hacer" count={pending.length}>
          {pending.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              footer={
                <Button
                  size="sm"
                  disabled={busyId === task.id}
                  onClick={() => run(task.id, "complete")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {busyId === task.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                  Ya la terminé
                </Button>
              }
            />
          ))}
        </TaskGroup>
      )}
      {waiting.length > 0 && (
        <TaskGroup title="Esperando aprobación" count={waiting.length}>
          {waiting.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TaskGroup>
      )}
      {rejected.length > 0 && (
        <TaskGroup title="Rechazadas" count={rejected.length}>
          {rejected.map((task) => (
            <TaskCard key={task.id} task={task}>
              {task.rejection_note && <p className="text-sm text-muted-foreground">Nota: {task.rejection_note}</p>}
            </TaskCard>
          ))}
        </TaskGroup>
      )}
      {paid.length > 0 && (
        <TaskGroup title="Cobradas" count={paid.length}>
          {paid.map((task) => (
            <TaskCard key={task.id} task={task} footer={<span className="text-sm text-emerald-700">Ganaste <CoinAmount amount={task.reward} /></span>} />
          ))}
        </TaskGroup>
      )}
    </div>
  )
}

export function TasksSection({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const { isChildMode } = useApp()
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{isChildMode ? "Mis tareas" : "Tareas"}</h1>
        <p className="text-muted-foreground">
          {isChildMode ? "Terminá tus tareas y ganá LoriCoins." : "Asigná tareas y aprobá las que tus hijos terminaron."}
        </p>
      </header>
      {isChildMode ? <ChildTasks /> : <ParentTasks onNavigate={onNavigate} />}
    </div>
  )
}
