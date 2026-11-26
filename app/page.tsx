"use client"

import { useState } from "react"
import { Loader2, LogOut, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoginScreen } from "@/components/login-screen"
import { AppFooter } from "@/components/app-footer"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/mobile-nav"
import { CoinAmount } from "@/components/loricoin/task-ui"
import { NotificationCenter } from "@/components/loricoin/notification-center"
import { ParentProfileDialog } from "@/components/loricoin/parent-profile-dialog"
import { RankingSection } from "@/components/sections/ranking-section"
import { GoalsSection } from "@/components/sections/goals-section"
import { DashboardSection } from "@/components/sections/dashboard-section"
import { TasksSection } from "@/components/sections/tasks-section"
import { FamilySection } from "@/components/sections/family-section"
import { MovementsSection } from "@/components/sections/movements-section"
import { LoriaSection } from "@/components/sections/loria-section"
import { LoriCoinsSection } from "@/components/sections/loricoins-section"
import { PremiosSection } from "@/components/sections/premios-section"
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
        return <LoriCoinsSection onGoToStore={() => setActiveSection("premios")} />
      case "premios":
        return <PremiosSection />
      case "ranking":
        return <RankingSection />
      case "metas":
        return <GoalsSection />
      default:
        return <DashboardSection onNavigate={setActiveSection} />
    }
  }

  return (
    <div className="flex min-h-dvh bg-gradient-to-br from-emerald-50/60 via-background to-yellow-50/60">
      <SidebarNav activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          {isChildMode ? (
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground">{profile.name}</span>
              <span className="text-xs text-muted-foreground">Hijo o hija</span>
            </div>
          ) : (
            <ParentProfileDialog />
          )}
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1"
              title={isChildMode ? "Tus LoriCoins" : "LoriCoins de tus hijos"}
            >
              <CoinAmount amount={headerCoins} />
            </span>
            <NotificationCenter />
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

      {activeSection !== "loria" && (
        <Button
          onClick={() => setActiveSection("loria")}
          className="fixed bottom-20 right-4 z-40 h-12 gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-white shadow-lg hover:from-violet-700 hover:to-fuchsia-700 md:bottom-6 md:right-6"
          aria-label="Abrir LorIA, tu asistente"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          LorIA
        </Button>
      )}

      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  )
}
