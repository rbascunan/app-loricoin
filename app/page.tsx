"use client"

import { useState } from "react"
import { AppProvider, useApp } from "@/lib/app-context"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardSection } from "@/components/sections/dashboard-section"
import { FamilySection } from "@/components/sections/family-section"
import { MovementsSection } from "@/components/sections/movements-section"
import { LoriaSection } from "@/components/sections/loria-section"
import { CommunitySection } from "@/components/sections/community-section"
import { LoricoinsSection } from "@/components/sections/loricoins-section"
import { LoginScreen } from "@/components/login-screen"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Button } from "@/components/ui/button"
import { LogOut, Coins } from "lucide-react"

function AppContent() {
  const { isLoggedIn, logout, currentUser, isChildMode } = useApp()
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />
  }

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <DashboardSection />
      case "family":
        return <FamilySection />
      case "movements":
        return <MovementsSection />
      case "loria":
        return <LoriaSection />
      case "community":
        return <CommunitySection />
      case "loricoins":
        return <LoricoinsSection />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <SidebarNav
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar with Notifications */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
              {currentUser.avatar}
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {isChildMode ? "Modo Estudiante" : "Modo Padre/Madre"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* LoriCoins Badge */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/20 text-accent">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">{currentUser.loriCoins}</span>
            </div>
            
            {/* Notifications */}
            <NotificationsPanel />
            
            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesion">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            {renderSection()}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
