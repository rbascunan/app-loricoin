"use client"

import { useState } from "react"
import { AppProvider } from "@/lib/app-context"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardSection } from "@/components/sections/dashboard-section"
import { FamilySection } from "@/components/sections/family-section"
import { MovementsSection } from "@/components/sections/movements-section"
import { LoriaSection } from "@/components/sections/loria-section"
import { CommunitySection } from "@/components/sections/community-section"
import { LoricoinsSection } from "@/components/sections/loricoins-section"
import { ScrollArea } from "@/components/ui/scroll-area"

function AppContent() {
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarNav
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            {renderSection()}
          </div>
        </ScrollArea>
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
