import { cn } from "@/lib/utils"

export function MonadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-5 h-5", className)}
    >
      <rect
        x="6.5"
        y="6.5"
        width="11"
        height="11"
        rx="3.5"
        transform="rotate(45 12 12)"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  )
}
