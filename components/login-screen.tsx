"use client"

import Image from "next/image"
import { useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorText } from "@/components/loricoin/task-ui"
import { AppFooter } from "@/components/app-footer"
import { PasswordInput } from "@/components/password-input"
import { useApp } from "@/lib/app-context"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { childEmailFor, isValidPin, isValidUsername, normalizeUsername } from "@/lib/loricoin/rules"

const sanitizeUsernameInput = (value: string) => normalizeUsername(value).replace(/[^a-z0-9]/g, "").slice(0, 20)
const sanitizePinInput = (value: string) => value.replace(/\D/g, "").slice(0, 6)

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Los datos no coinciden. Revisalos e intentá de nuevo."
  if (/email not confirmed/i.test(message)) return "Todavía no confirmaste tu correo. Revisá tu bandeja de entrada."
  if (/signups? not allowed|signup.*disabled/i.test(message))
    return "El registro de cuentas nuevas está desactivado. Pedile al administrador que lo active."
  if (/already registered|already exists/i.test(message)) return "Ya existe una cuenta con ese correo. Ingresá en vez de crear una nueva."
  if (/password/i.test(message)) return "La contraseña tiene que tener al menos 8 caracteres."
  if (/rate limit|too many/i.test(message)) return "Demasiados intentos. Esperá unos minutos y probá de nuevo."
  return "No pudimos completar la operación. Intentá de nuevo."
}

function ParentForm() {
  const { supabase } = useApp()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === "signup" && !name.trim()) return setError("Ingresá tu nombre.")
    if (password.length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres.")

    setPending(true)
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setError(translateAuthError(error.message))
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          },
        })
        if (error) setError(translateAuthError(error.message))
        else if (!data.session) setInfo("Te enviamos un correo para confirmar tu cuenta. Después volvé y entrá.")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="parent-name">Tu nombre</Label>
          <Input
            id="parent-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="parent-email">Correo electrónico</Label>
        <Input
          id="parent-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="parent-password">Contraseña</Label>
        <PasswordInput
          id="parent-password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <ErrorText message={error} />
      {info && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {info}
        </p>
      )}
      <Button type="submit" disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </Button>
      <button
        type="button"
        className="text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login")
          setError(null)
          setInfo(null)
        }}
      >
        {mode === "login" ? "¿No tenés cuenta? Creá una" : "¿Ya tenés cuenta? Ingresá"}
      </button>
    </form>
  )
}

function ChildForm() {
  const { supabase } = useApp()
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValidUsername(username)) return setError("El usuario tiene entre 3 y 20 letras o números.")
    if (!isValidPin(pin)) return setError("El PIN tiene 6 números.")

    setPending(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: childEmailFor(username), password: pin })
      if (error) {
        setError(
          /invalid login credentials/i.test(error.message)
            ? "Usuario o PIN incorrectos. Si no te acordás, pedile ayuda a tu papá o mamá."
            : translateAuthError(error.message),
        )
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="child-username">Tu usuario</Label>
        <Input
          id="child-username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
          placeholder="ej: betito"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="child-pin">Tu PIN de 6 números</Label>
        <PasswordInput
          id="child-pin"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(sanitizePinInput(e.target.value))}
          className="tracking-[0.5em]"
          required
        />
      </div>
      <ErrorText message={error} />
      <Button type="submit" disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Entrar
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Tu usuario y PIN te los da tu papá o mamá desde su cuenta.
      </p>
    </form>
  )
}

export function LoginScreen() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-yellow-50">
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="relative mx-auto h-24 w-24">
            <Image src={LORICOIN_IMAGES.coin} alt="Lorito de LoriCoin" fill className="object-contain" unoptimized priority />
          </div>
          <CardTitle className="text-3xl font-bold text-emerald-700">LoriCoin</CardTitle>
          <CardDescription>Finanzas para chicos, con la familia</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="parent">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="parent">Padre o madre</TabsTrigger>
              <TabsTrigger value="child">Hijo o hija</TabsTrigger>
            </TabsList>
            <TabsContent value="parent">
              <ParentForm />
            </TabsContent>
            <TabsContent value="child">
              <ChildForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
    <AppFooter />
    </div>
  )
}
