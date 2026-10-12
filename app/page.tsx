"use client"

import { useState } from "react"
import { Bell, Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoginScreen } from "@/components/login-screen"
import { AppFooter } from "@/components/app-footer"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/mobile-nav"
import { ComingSoonSection } from "@/components/coming-soon"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { DashboardSection } from "@/components/sections/dashboard-section"
import { TasksSection } from "@/components/sections/tasks-section"
import { FamilySection } from "@/components/sections/family-section"
import { MovementsSection } from "@/components/sections/movements-section"
import { LoriaSection } from "@/components/sections/loria-section"
import { LoriCoinsSection } from "@/components/sections/loricoins-section"
import { useApp } from "@/lib/app-context"
import type { SectionId } from "@/lib/navigation"

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-yellow-50">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Cargando" />
    </div>
  )
}

function DataError({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-yellow-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 p-6 text-center">
          <p role="alert" className="font-medium text-foreground">
            {message}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={onRetry} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Reintentar
            </Button>
            <Button variant="outline" onClick={onSignOut}>
              Salir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Home() {
  const { authStatus, profile, children, isChildMode, dataError, refresh, signOut } = useApp()
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard")

  if (authStatus === "loading") return <FullScreenLoader />
  if (authStatus === "signedOut") return <LoginScreen />
  if (!profile) {
    return dataError ? <DataError message={dataError} onRetry={refresh} onSignOut={signOut} /> : <FullScreenLoader />
  }

  const headerCoins = isChildMode ? profile.lori_coins : children.reduce((sum, c) => sum + c.lori_coins, 0)

  const renderSection = () => {
    switch (activeSection) {
      case "tasks":
        return <TasksSection onNavigate={setActiveSection} />
      case "family":
        return <FamilySection />
      case "movements":
        return <MovementsSection />
      case "loria":
        return <LoriaSection />
      case "loricoins":
        return <LoriCoinsSection />
      case "premios":
        return <ComingSoonSection featureId="premios" />
      case "ranking":
        return <ComingSoonSection featureId="ranking" />
      default:
        return <DashboardSection onNavigate={setActiveSection} />
    }
  }

  return (
    <div className="flex min-h-dvh bg-gradient-to-br from-emerald-50/60 via-background to-yellow-50/60">
      <SidebarNav activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-foreground">{profile.name}</span>
            <span className="text-xs text-muted-foreground">{isChildMode ? "Hijo o hija" : "Padre o madre"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1"
              title={isChildMode ? "Tus LoriCoins" : "LoriCoins de tus hijos"}
            >
              <CoinAmount amount={headerCoins} />
            </span>
            <Button variant="ghost" size="icon" disabled title="Alertas: próximamente" aria-label="Alertas, próximamente">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className={`flex-1 p-4 md:p-6 ${activeSection === "loria" ? "flex h-[calc(100dvh-4rem)] flex-col" : ""}`}>
          {renderSection()}
        </main>
        <AppFooter className="border-t pb-24 md:pb-3" />
      </div>

      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  )
}
