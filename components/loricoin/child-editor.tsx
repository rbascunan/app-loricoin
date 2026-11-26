"use client"

import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Camera, Loader2, Pencil } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorText } from "@/components/loricoin/task-ui"
import { useApp } from "@/lib/app-context"
import { initials } from "@/lib/loricoin/client-utils"
import { isValidPin, isValidUsername, normalizeUsername } from "@/lib/loricoin/rules"
import type { ChildSummary } from "@/lib/loricoin/types"

const AVATAR_SIZE = 256

async function resizeToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = url
    await img.decode()
    const side = Math.min(img.width, img.height)
    const canvas = document.createElement("canvas")
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No pudimos procesar la foto")
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function patchChild(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/children/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "No pudimos guardar los cambios")
}

export function ChildAvatar({ name, avatar, className }: { name: string; avatar: string | null; className?: string }) {
  return (
    <Avatar className={className ?? "h-12 w-12"}>
      {avatar && <AvatarImage src={avatar} alt="" className="object-cover" />}
      <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-800">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

export function AvatarUploader({ child }: { child: Pick<ChildSummary, "id" | "name" | "avatar"> }) {
  const { refresh } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return setError("Elegí una imagen")
    setBusy(true)
    setError(null)
    try {
      await patchChild(child.id, { avatar: await resizeToDataUrl(file) })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos subir la foto")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <ChildAvatar name={child.name} avatar={child.avatar} className="h-20 w-20" />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border shadow-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Cambiar foto de perfil"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} tabIndex={-1} />
      <ErrorText message={error} />
    </div>
  )
}

export function ChildEditDialog({ child }: { child: ChildSummary }) {
  const { refresh } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(child.name)
  const [username, setUsername] = useState(child.username ?? "")
  const [pin, setPin] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(child.name)
      setUsername(child.username ?? "")
      setPin("")
      setError(null)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const normalized = normalizeUsername(username)
    if (!name.trim()) return setError("Escribí un nombre")
    if (!isValidUsername(normalized)) return setError("El usuario debe tener entre 3 y 20 letras o números")
    if (pin && !isValidPin(pin)) return setError("El PIN tiene que tener 6 números")
    const body: Record<string, unknown> = {}
    if (name.trim() !== child.name) body.name = name.trim()
    if (normalized !== child.username) body.username = normalized
    if (pin) body.pin = pin
    if (Object.keys(body).length === 0) return setOpen(false)
    setSaving(true)
    setError(null)
    try {
      await patchChild(child.id, body)
      await refresh()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Editar a ${child.name}`}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar a {child.name}</DialogTitle>
          <DialogDescription>Cambiá la foto, el nombre, el usuario o el PIN de acceso.</DialogDescription>
        </DialogHeader>
        <AvatarUploader child={child} />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-name-${child.id}`}>Nombre</Label>
            <Input id={`edit-name-${child.id}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-user-${child.id}`}>Usuario</Label>
            <Input
              id={`edit-user-${child.id}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
              maxLength={20}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-pin-${child.id}`}>Nuevo PIN (opcional)</Label>
            <Input
              id={`edit-pin-${child.id}`}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              placeholder="6 números"
            />
            <p className="text-xs text-muted-foreground">Dejalo vacío para mantener el PIN actual.</p>
          </div>
          <ErrorText message={error} />
          <DialogFooter>
            <Button type="submit" disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
