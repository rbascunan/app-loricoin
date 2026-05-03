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
import { PremiosSection } from "@/components/sections/premios-section"
import { LoginScreen } from "@/components/login-screen"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import Image from "next/image"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
      case "premios":
        return <PremiosSection />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="flex min-h-screen min-h-dvh bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <SidebarNav
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Notifications */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 border-b bg-white/80 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Logo */}
            <div className="lg:hidden w-10 h-10 rounded-full overflow-hidden">
              <Image 
                src={LORICOIN_IMAGES.coin}
                alt="LoriCoin" 
                width={40} 
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <Avatar className="w-10 h-10 border-2 border-emerald-400 shadow-md">
              {currentUser.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-emerald-600 font-medium">
                {isChildMode ? "Modo Estudiante" : "Modo Padre/Madre"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* LoriCoins Badge */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md">
              <Image 
                src={LORICOIN_IMAGES.coin}
                alt="LoriCoins" 
                width={24} 
                height={24}
                className="w-6 h-6 rounded-full"
                unoptimized
              />
              <span className="text-sm font-bold">{currentUser.loriCoins}</span>
            </div>
            
            {/* Notifications */}
            <NotificationsPanel />
            
            {/* Logout */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout} 
              title="Cerrar sesion"
              className="hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area - full scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 pb-28 lg:pb-8 min-h-full">
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
