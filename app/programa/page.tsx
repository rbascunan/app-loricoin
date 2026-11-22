import type { Metadata } from "next"
import { ProgramDemo } from "@/components/onchain/program-demo"

export const metadata: Metadata = {
  title: "Programa on-chain · LoriCoin",
  description: "Demo del programa Anchor de LoriCoin en Solana devnet: familias, hijos y tareas con PDAs.",
}

export default function ProgramPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-emerald-50 via-teal-50 to-yellow-50 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-emerald-800 text-balance">Programa LoriCoin en Solana</h1>
          <p className="text-muted-foreground text-pretty">
            Cada familia, hijo y tarea es una cuenta del programa Anchor en devnet. Conectá Phantom (en devnet) para
            firmar: solo la wallet que creó la familia puede crear tareas, aprobarlas o cerrar cuentas.
          </p>
        </header>
        <ProgramDemo />
      </div>
    </main>
  )
}
