import { cn } from "@/lib/utils"

export const APP_VERSION = "0.1.0"
export const APP_RELEASE = "10/2026"

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("px-4 py-3 text-center text-xs text-muted-foreground", className)}>
      Desarrollado por <span className="font-bold text-foreground">Betito Bascuñan</span> gracias a Vercel
      <span aria-hidden="true"> · </span>
      <span className="font-mono">v{APP_VERSION}</span>
      <span aria-hidden="true"> · </span>
      {APP_RELEASE}
    </footer>
  )
}
