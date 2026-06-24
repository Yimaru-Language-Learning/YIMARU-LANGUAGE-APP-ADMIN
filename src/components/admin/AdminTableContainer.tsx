import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

type AdminTableContainerProps = {
  children: ReactNode
  className?: string
  minWidth?: number
}

export function AdminTableContainer({
  children,
  className,
  minWidth,
}: AdminTableContainerProps) {
  return (
    <div className={cn("min-w-0 overflow-x-auto rounded-lg border border-grayScale-100", className)}>
      <div style={minWidth ? { minWidth } : undefined} className={minWidth ? undefined : "min-w-0"}>
        {children}
      </div>
    </div>
  )
}
