import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

type AdminPageHeaderProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-sm font-semibold text-grayScale-500">{eyebrow}</p>
        ) : null}
        <div className={cn(eyebrow && "mt-1")}>{title}</div>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
