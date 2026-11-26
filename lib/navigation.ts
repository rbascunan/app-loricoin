import {
  ArrowRightLeft,
  Bot,
  Coins,
  Gift,
  LayoutDashboard,
  ListChecks,
  Target,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

export type SectionId =
  | "dashboard"
  | "tasks"
  | "family"
  | "movements"
  | "loria"
  | "loricoins"
  | "premios"
  | "ranking"
  | "metas"

export interface NavItem {
  id: SectionId
  label: string
  shortLabel: string
  icon: LucideIcon
  comingSoon?: boolean
  ai?: boolean
  mobile?: boolean
}

export function getNavItems(isChild: boolean): NavItem[] {
  return [
    { id: "dashboard", label: "Inicio", shortLabel: "Inicio", icon: LayoutDashboard, mobile: true },
    { id: "tasks", label: "Tareas", shortLabel: "Tareas", icon: ListChecks, mobile: true },
    isChild
      ? { id: "family", label: "Mi perfil", shortLabel: "Perfil", icon: User, mobile: true }
      : { id: "family", label: "Familia", shortLabel: "Familia", icon: Users, mobile: true },
    { id: "movements", label: "Movimientos", shortLabel: "Movim.", icon: ArrowRightLeft, mobile: true },
    { id: "loria", label: "LorIA", shortLabel: "LorIA", icon: Bot, ai: true },
    { id: "loricoins", label: "LoriCoins", shortLabel: "Coins", icon: Coins, mobile: true },
    { id: "premios", label: "Tienda", shortLabel: "Tienda", icon: Gift, mobile: true },
    { id: "metas", label: "Metas de ahorro", shortLabel: "Metas", icon: Target, mobile: true },
    { id: "ranking", label: "Ranking", shortLabel: "Ranking", icon: Trophy, mobile: true },
  ]
}
