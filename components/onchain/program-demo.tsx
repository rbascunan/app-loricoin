"use client"

import { useMemo, useState, type FormEvent } from "react"
import useSWR from "swr"
import { Connection, type PublicKey, type TransactionInstruction } from "@solana/web3.js"
import { CheckCircle2, ExternalLink, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  RPC_URL,
  describeProgramError,
  explorerAddress,
  explorerTx,
  fetchFamilyState,
  getPhantom,
  getProgramId,
  instructions,
  sendWithWallet,
  type ChildAccount,
  type PhantomProvider,
  type TaskAccount,
} from "@/lib/loricoin-program"

type LogEntry = { label: string; signature?: string; error?: string }

const short = (key: PublicKey | string) => {
  const s = typeof key === "string" ? key : key.toBase58()
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

export function ProgramDemo() {
  const programId = useMemo(() => getProgramId(), [])
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), [])
  const [wallet, setWallet] = useState<PhantomProvider | null>(null)
  const [parent, setParent] = useState<PublicKey | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const { data, isLoading, mutate } = useSWR(
    programId && parent ? ["family", programId.toBase58(), parent.toBase58()] : null,
    () => fetchFamilyState(connection, programId!, parent!),
  )

  async function connect() {
    const provider = getPhantom()
    if (!provider) {
      window.open("https://phantom.app/", "_blank", "noopener")
      return
    }
    const { publicKey } = await provider.connect()
    setWallet(provider)
    setParent(publicKey)
  }

  async function run(label: string, build: () => Promise<TransactionInstruction>) {
    if (!wallet || !parent) return
    setBusy(label)
    try {
      const signature = await sendWithWallet(connection, wallet, parent, await build())
      setLog((prev) => [{ label, signature }, ...prev])
      await mutate()
    } catch (err) {
      setLog((prev) => [{ label, error: describeProgramError(err) }, ...prev])
    } finally {
      setBusy(null)
    }
  }

  if (!programId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Falta configurar <code className="font-mono">NEXT_PUBLIC_LORICOIN_PROGRAM_ID</code> con el Program ID
          desplegado en devnet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Programa en devnet</span>
            <a
              href={explorerAddress(programId.toBase58())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline"
            >
              {short(programId)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          {parent ? (
            <span className="font-mono text-sm text-foreground">Wallet: {short(parent)}</span>
          ) : (
            <Button onClick={connect} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Conectar Phantom
            </Button>
          )}
        </CardContent>
      </Card>

      {parent && isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Cargando datos on-chain" />
        </div>
      )}

      {parent && data && !data.family && (
        <TextForm
          title="Crear familia"
          label="Nombre de la familia"
          button="Crear familia"
          busy={busy === "Crear familia"}
          onSubmit={(name) => run("Crear familia", () => instructions.createFamily(programId, parent, name))}
        />
      )}

      {parent && data?.family && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{data.family.name}</CardTitle>
              <a
                href={explorerAddress(data.family.address.toBase58())}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-emerald-700 hover:underline"
              >
                PDA familia: {short(data.family.address)}
              </a>
            </CardHeader>
          </Card>

          <TextForm
            title="Agregar hijo o hija"
            label="Nombre"
            button="Agregar"
            busy={busy === "Agregar hijo"}
            onSubmit={(name) =>
              run("Agregar hijo", () => instructions.addChild(programId, parent, data.family!, name))
            }
          />

          {data.children.map((child) => (
            <ChildCard
              key={child.address.toBase58()}
              child={child}
              busy={busy}
              onCreateTask={(title, reward) =>
                run(`Crear tarea (${child.name})`, () =>
                  instructions.createTask(programId, parent, child, title, reward),
                )
              }
              onApprove={(task) =>
                run(`Aprobar "${task.title}"`, () => instructions.approveTask(programId, parent, child, task))
              }
              onUpdate={(task, reward) =>
                run(`Editar "${task.title}"`, () =>
                  instructions.updateTaskReward(programId, parent, child, task, reward),
                )
              }
              onClose={() => run(`Cerrar ${child.name}`, () => instructions.closeChild(programId, parent, child))}
            />
          ))}
        </>
      )}

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
              {log.map((entry, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{entry.label}</span>
                  {entry.signature ? (
                    <a
                      href={explorerTx(entry.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline"
                    >
                      {short(entry.signature)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <span role="alert" className="text-destructive">
                      Rechazada: {entry.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TextForm(props: {
  title: string
  label: string
  button: string
  busy: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState("")
  const id = `field-${props.title.replace(/\s+/g, "-").toLowerCase()}`
  function submit(e: FormEvent) {
    e.preventDefault()
    props.onSubmit(value)
    setValue("")
  }
  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={id}>{props.label}</Label>
            <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} maxLength={48} />
          </div>
          <Button type="submit" disabled={props.busy} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {props.busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {props.button}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ChildCard(props: {
  child: ChildAccount & { tasks: TaskAccount[] }
  busy: string | null
  onCreateTask: (title: string, reward: number) => void
  onApprove: (task: TaskAccount) => void
  onUpdate: (task: TaskAccount, reward: number) => void
  onClose: () => void
}) {
  const { child } = props
  const [title, setTitle] = useState("")
  const [reward, setReward] = useState("10")
  const base = `child-${child.id}`

  function submit(e: FormEvent) {
    e.preventDefault()
    props.onCreateTask(title, Number(reward))
    setTitle("")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">{child.name}</CardTitle>
          <span className="font-mono text-xs text-muted-foreground">PDA: {short(child.address)}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-700">{child.balance}</p>
          <p className="text-xs text-muted-foreground">LoriCoins on-chain</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {child.tasks.length === 0 && <li className="text-sm text-muted-foreground">Sin tareas todavía.</li>}
          {child.tasks.map((task) => (
            <li
              key={task.address.toBase58()}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
            >
              <span className="flex items-center gap-2">
                {task.approved && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Aprobada" />}
                {task.title} · {task.reward} LC
              </span>
              {!task.approved && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = window.prompt("Nueva recompensa (1 a 1000)", String(task.reward))
                      if (next) props.onUpdate(task, Number(next))
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => props.onApprove(task)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Aprobar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={`${base}-title`}>Nueva tarea</Label>
            <Input id={`${base}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={48} />
          </div>
          <div className="flex w-28 flex-col gap-2">
            <Label htmlFor={`${base}-reward`}>Recompensa</Label>
            <Input
              id={`${base}-reward`}
              type="number"
              inputMode="numeric"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={props.busy !== null}>
            Crear tarea
          </Button>
        </form>

        <Button variant="ghost" className="self-start text-destructive" onClick={props.onClose}>
          Cerrar cuenta de {child.name}
        </Button>
      </CardContent>
    </Card>
  )
}
