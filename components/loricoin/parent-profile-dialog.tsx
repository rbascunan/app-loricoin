"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { KeyRound, Loader2, Mail, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordInput } from "@/components/password-input"
import { AvatarUploader, ChildAvatar } from "@/components/loricoin/child-editor"
import { ErrorText } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"

export function authRedirectUrl(next: string) {
  const base = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
  const url = new URL(base)
  url.searchParams.set("next", next)
  return url.toString()
}

async function patchProfile(body: Record<string, unknown>) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "No pudimos guardar los cambios")
}

function authErrorMessage(message: string) {
  if (/rate limit|too many/i.test(message)) return "Demasiados intentos. Esperá unos minutos y probá de nuevo."
  if (/same|different from the old/i.test(message)) return "La nueva contraseña tiene que ser distinta de la actual."
  if (/weak|password/i.test(message)) return "Elegí una contraseña más segura (mínimo 8 caracteres)."
  if (/already|exists|registered/i.test(message)) return "Ese correo ya está en uso por otra cuenta."
  if (/invalid.*email|email.*invalid/i.test(message)) return "Ese correo no es válido."
  return "No pudimos completar la operación. Intentá de nuevo."
}

function Status({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
      {message}
    </p>
  )
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}

function ProfileTab() {
  const { profile, refresh } = useApp()
  const [name, setName] = useState(profile?.name ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  if (!profile) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!name.trim()) return setError("Escribí tu nombre")
    if (name.trim() === profile?.name) return setInfo("No hay cambios para guardar.")
    setPending(true)
    try {
      await patchProfile({ name: name.trim() })
      await refresh()
      setInfo("Nombre actualizado.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AvatarUploader
        child={{ id: profile.id, name: profile.name, avatar: profile.avatar ?? null }}
        save={async (avatar) => {
          await patchProfile({ avatar })
          await refresh()
        }}
      />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-name">Tu nombre</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          <p className="text-xs text-muted-foreground">Es el nombre que ven tus hijos en la app.</p>
        </div>
        <ErrorText message={error} />
        <Status message={info} />
        <SubmitButton pending={pending}>Guardar nombre</SubmitButton>
      </form>
    </div>
  )
}

function EmailTab({ email }: { email: string | null }) {
  const { supabase } = useApp()
  const [newEmail, setNewEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const target = newEmail.trim().toLowerCase()
    if (!target) return setError("Escribí el correo nuevo")
    if (target === email?.toLowerCase()) return setError("Ese ya es tu correo actual")
    setPending(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: target }, { emailRedirectTo: authRedirectUrl("/") })
      if (error) return setError(authErrorMessage(error.message))
      setNewEmail("")
      setInfo(`Te enviamos un enlace de confirmación a ${target}. El cambio se aplica cuando lo abras (puede que también llegue un aviso a tu correo actual).`)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-xl border bg-muted/40 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Correo para iniciar sesión</span>
        <span className="break-all font-semibold text-foreground">{email ?? "Cargando..."}</span>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-new-email">Correo nuevo</Label>
          <Input
            id="profile-new-email"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nombre@correo.com"
          />
        </div>
        <ErrorText message={error} />
        <Status message={info} />
        <SubmitButton pending={pending}>Cambiar correo</SubmitButton>
      </form>
    </div>
  )
}

function PasswordTab({ email, recovery, onDone }: { email: string | null; recovery: boolean; onDone: () => void }) {
  const { supabase } = useApp()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!recovery && !current) return setError("Escribí tu contraseña actual")
    if (next.length < 8) return setError("La nueva contraseña tiene que tener al menos 8 caracteres")
    if (next !== confirm) return setError("Las contraseñas nuevas no coinciden")
    if (!email) return setError("No pudimos leer tu correo. Cerrá y volvé a abrir tu perfil.")
    setPending(true)
    try {
      if (!recovery) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: current })
        if (error) return setError(/invalid/i.test(error.message) ? "La contraseña actual no es correcta" : authErrorMessage(error.message))
      }
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) return setError(authErrorMessage(error.message))
      setCurrent("")
      setNext("")
      setConfirm("")
      setInfo("Contraseña actualizada. La próxima vez ingresá con la nueva.")
      if (recovery) onDone()
    } finally {
      setPending(false)
    }
  }

  async function sendResetLink() {
    if (!email) return
    setError(null)
    setInfo(null)
    setResetPending(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl("/?reset=1") })
      if (error) return setError(authErrorMessage(error.message))
      setInfo(`Te enviamos un enlace a ${email} para crear una contraseña nueva.`)
    } finally {
      setResetPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {recovery ? (
        <Status message="Estás recuperando tu cuenta. Elegí tu contraseña nueva." />
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-current-password">Contraseña actual</Label>
          <PasswordInput
            id="profile-current-password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-new-password">Contraseña nueva</Label>
        <PasswordInput
          id="profile-new-password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          minLength={8}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-confirm-password">Repetí la contraseña nueva</Label>
        <PasswordInput
          id="profile-confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
        />
      </div>
      <ErrorText message={error} />
      {!recovery && <Status message={info} />}
      <SubmitButton pending={pending}>Cambiar contraseña</SubmitButton>
      {!recovery && (
        <button
          type="button"
          onClick={sendResetLink}
          disabled={resetPending || !email}
          className="text-sm font-medium text-emerald-700 underline-offset-4 hover:underline disabled:opacity-60"
        >
          {resetPending ? "Enviando..." : "¿No te acordás de la actual? Enviame un enlace por correo"}
        </button>
      )}
    </form>
  )
}

export function ParentProfileDialog() {
  const { supabase, profile } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("perfil")
  const [email, setEmail] = useState<string | null>(null)
  const [recovery, setRecovery] = useState(false)

  async function loadEmail() {
    const { data } = await supabase.auth.getUser()
    setEmail(data.user?.email ?? null)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) void loadEmail()
    else setRecovery(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("reset") !== "1") return
    window.history.replaceState(null, "", window.location.pathname)
    setRecovery(true)
    setTab("clave")
    setOpen(true)
    void loadEmail()
    // Runs once on mount to pick up the password-recovery redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return null

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex min-w-0 items-center gap-3 rounded-full py-1 pl-1 pr-3 text-left transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Abrir mi perfil"
      >
        <ChildAvatar name={profile.name} avatar={profile.avatar ?? null} className="h-10 w-10 shrink-0" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{profile.name}</span>
          <span className="text-xs text-muted-foreground">Padre o madre · Mi perfil</span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mi perfil</DialogTitle>
            <DialogDescription>Tu foto, tu nombre y tus datos para iniciar sesión.</DialogDescription>
          </DialogHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="perfil" className="gap-1.5">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="correo" className="gap-1.5">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Correo
              </TabsTrigger>
              <TabsTrigger value="clave" className="gap-1.5">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Contraseña
              </TabsTrigger>
            </TabsList>
            <TabsContent value="perfil">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="correo">
              <EmailTab email={email} />
            </TabsContent>
            <TabsContent value="clave">
              <PasswordTab email={email} recovery={recovery} onDone={() => setRecovery(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
