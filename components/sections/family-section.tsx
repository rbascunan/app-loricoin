"use client"

import { useState, type FormEvent } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CoinAmount, ErrorText } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { initials, postJson } from "@/lib/loricoin/client-utils"
import { LIMITS, isValidPin, isValidUsername, normalizeUsername } from "@/lib/loricoin/rules"
import type { ChildSummary } from "@/lib/loricoin/types"

function CreateChildForm() {
  const { refresh } = useApp()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<ChildSummary | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreated(null)
    if (!name.trim()) return setError("Ingresá el nombre.")
    if (!isValidUsername(username)) return setError("El usuario tiene que tener entre 3 y 20 letras minúsculas o números.")
    if (!isValidPin(pin)) return setError("El PIN tiene que tener exactamente 6 números.")

    setPending(true)
    try {
      const child = await postJson<ChildSummary>("/api/children", { name, username, pin })
      setCreated(child)
      setName("")
      setUsername("")
      setPin("")
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
        <CardTitle className="text-lg">Agregar un hijo o hija</CardTitle>
        <CardDescription>
          Elegí un usuario y un PIN. Con esos datos va a entrar en la pestaña &quot;Hijo o hija&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="child-name">Nombre</Label>
            <Input
              id="child-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.childName}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-child-username">Usuario</Label>
              <Input
                id="new-child-username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(normalizeUsername(e.target.value).replace(/[^a-z0-9]/g, "").slice(0, 20))}
                placeholder="ej: betito"
                aria-describedby="username-help"
                required
              />
              <p id="username-help" className="text-xs text-muted-foreground">
                De 3 a 20 letras minúsculas o números.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-child-pin">PIN de 6 números</Label>
              <Input
                id="new-child-pin"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="tracking-[0.4em]"
                required
              />
            </div>
          </div>
          <ErrorText message={error} />
          {created && (
            <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              Listo. {created.name} ya puede entrar con el usuario <strong>{created.username}</strong> y el PIN que
              elegiste.
            </p>
          )}
          <Button type="submit" disabled={pending} className="self-start bg-emerald-600 text-white hover:bg-emerald-700">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            Crear cuenta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PersonCard({ name, username, coins, detail }: { name: string; username: string | null; coins: number; detail?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-800">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-foreground">{name}</span>
          {username && <span className="text-sm text-muted-foreground">Usuario: {username}</span>}
          {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
        </div>
        <CoinAmount amount={coins} />
      </CardContent>
    </Card>
  )
}

export function FamilySection() {
  const { isChildMode, profile, children, tasks } = useApp()

  if (isChildMode) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
          <p className="text-muted-foreground">Tus datos en LoriCoin.</p>
        </header>
        <PersonCard name={profile?.name ?? ""} username={profile?.username ?? null} coins={profile?.lori_coins ?? 0} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Familia</h1>
        <p className="text-muted-foreground">Creá las cuentas de tus hijos y seguí sus LoriCoins.</p>
      </header>
      <section aria-labelledby="children-title" className="flex flex-col gap-3">
        <h2 id="children-title" className="text-lg font-semibold text-foreground">
          Tus hijos ({children.length})
        </h2>
        {children.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no agregaste a nadie.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {children.map((child) => {
              const active = tasks.filter(
                (t) => t.child_id === child.id && (t.status === "pendiente" || t.status === "terminada"),
              ).length
              return (
                <PersonCard
                  key={child.id}
                  name={child.name}
                  username={child.username}
                  coins={child.lori_coins}
                  detail={`${active} ${active === 1 ? "tarea activa" : "tareas activas"}`}
                />
              )
            })}
          </div>
        )}
      </section>
      <CreateChildForm />
    </div>
  )
}
