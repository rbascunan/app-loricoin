"use client"

import { useState } from "react"
import { BadgeCheck, Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const EXPLORER = "https://explorer.solana.com"

export const explorerTxUrl = (signature: string) => `${EXPLORER}/tx/${signature}?cluster=devnet`
export const explorerAddressUrl = (address: string) => `${EXPLORER}/address/${address}?cluster=devnet`

export function shortAddress(value: string, size = 4) {
  return value.length <= size * 2 + 1 ? value : `${value.slice(0, size)}…${value.slice(-size)}`
}

export function VerifiedOnSolana({ signature, label = "Ver en Solana Explorer" }: { signature: string; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Verificado en Solana
      </span>
      <a
        href={explorerTxUrl(signature)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-violet-700 underline-offset-2 hover:underline"
      >
        {label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    </div>
  )
}

export function WalletAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground" title={address}>
        {shortAddress(address, 6)}
      </code>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>{copied ? "Copiada" : "Copiar"}</span>
      </Button>
      <a
        href={explorerAddressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 underline-offset-2 hover:underline"
      >
        Ver wallet
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    </div>
  )
}

export function ChainFallbackNotice({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p className="text-xs text-muted-foreground" role="status">
      No pudimos consultar Solana ahora; mostramos el último saldo guardado.
    </p>
  )
}

/** Animación breve de monedas al confirmarse un pago. Decorativa. */
export function CoinBurst({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="coin-burst absolute h-8 w-8 rounded-full border-2 border-amber-500 bg-amber-300 shadow-md"
          style={{ "--angle": `${i * 45}deg` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
