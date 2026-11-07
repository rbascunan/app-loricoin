"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { ChildSummary, MeResponse, Penalty, Profile, Redemption, Task, WalletResponse } from "@/lib/loricoin/types"

async function fetchWallet([url]: [string, string]): Promise<WalletResponse> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("No se pudo consultar el saldo")
  return (await res.json()) as WalletResponse
}

type AuthStatus = "loading" | "signedOut" | "signedIn"

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function fetchMe([url]: [string, string]): Promise<MeResponse> {
  const res = await fetch(url, { cache: "no-store" })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(body?.error ?? "No se pudieron cargar tus datos", res.status)
  return body as MeResponse
}

interface AppContextValue {
  supabase: ReturnType<typeof createClient>
  authStatus: AuthStatus
  wallet: WalletResponse | null
  /** Saldo on-chain del hijo; si Solana no respondió, usa el valor de respaldo. */
  balanceOf: (childId: string | undefined, fallback: number) => number
  profile: Profile | null
  children: ChildSummary[]
  tasks: Task[]
  penalties: Penalty[]
  redemptions: Redemption[]
  isChildMode: boolean
  isLoadingData: boolean
  dataError: string | null
  refresh: () => Promise<unknown>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children: content }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUserId(data.session?.user.id ?? null)
      setAuthStatus(data.session ? "signedIn" : "signedOut")
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setAuthStatus(session ? "signedIn" : "signedOut")
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const { data, error, isLoading, mutate } = useSWR(
    authStatus === "signedIn" && userId ? ["/api/me", userId] : null,
    fetchMe,
    { refreshInterval: 8000, revalidateOnFocus: true, revalidateOnReconnect: true },
  )

  const { data: wallet, mutate: mutateWallet } = useSWR(
    authStatus === "signedIn" && userId ? ["/api/wallet", userId] : null,
    fetchWallet,
    { refreshInterval: 15000, revalidateOnFocus: true },
  )

  const balanceOf = (childId: string | undefined, fallback: number) =>
    wallet?.balances.find((b) => b.childId === childId)?.amount ?? fallback

  const value: AppContextValue = {
    supabase,
    authStatus,
    wallet: wallet ?? null,
    balanceOf,
    profile: data?.profile ?? null,
    children: data?.children ?? [],
    tasks: data?.tasks ?? [],
    penalties: data?.penalties ?? [],
    redemptions: data?.redemptions ?? [],
    isChildMode: data?.profile.role === "child",
    isLoadingData: isLoading,
    dataError: error ? (error as Error).message : null,
    refresh: () => Promise.all([mutate(), mutateWallet()]),
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AppContext.Provider value={value}>{content}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
