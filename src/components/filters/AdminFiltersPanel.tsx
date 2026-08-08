import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

export type AdminFiltersPanelProps = {
  search?: ReactNode
  children?: ReactNode
  /** Renders in place of the show/hide toggle; keeps filters always visible. */
  actions?: ReactNode
  activeFilterCount?: number
  onClearFilters?: () => void
  clearLabel?: string
  defaultOpen?: boolean
  className?: string
  footer?: ReactNode
  summary?: ReactNode
}

export function AdminFiltersPanel({
  search,
  children,
  actions,
  activeFilterCount = 0,
  onClearFilters,
  clearLabel = "Clear filters",
  defaultOpen = false,
  className,
  footer,
  summary,
}: AdminFiltersPanelProps) {
  const [open, setOpen] = useState(defaultOpen || activeFilterCount > 0)
  const inlineActions = Boolean(actions)

  useEffect(() => {
    if (!inlineActions && activeFilterCount > 0) {
      setOpen(true)
    }
  }, [activeFilterCount, inlineActions])

  return (
    <div
      className={cn(
        "rounded-xl border border-grayScale-100 bg-white shadow-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-4">
        {search ? (
          <div className="min-w-0 w-full flex-1 sm:min-w-[200px]">{search}</div>
        ) : null}
        {inlineActions ? (
          <div className="h-9 shrink-0">{actions}</div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-2"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {open ? "Hide filters" : "Show filters"}
            {activeFilterCount > 0 ? (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            ) : null}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </Button>
        )}
        {activeFilterCount > 0 && onClearFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 gap-1 text-grayScale-500"
            onClick={onClearFilters}
          >
            <X className="h-3.5 w-3.5" />
            {clearLabel}
          </Button>
        ) : null}
        {summary ? <div className="ml-auto text-xs text-grayScale-500">{summary}</div> : null}
      </div>
      {inlineActions ? (
        footer ? (
          <div className="border-t border-grayScale-100 px-4 pb-3 pt-2 text-xs text-grayScale-400">
            {footer}
          </div>
        ) : null
      ) : open ? (
        <div className="space-y-3 border-t border-grayScale-100 px-4 pb-4 pt-3">
          {children}
          {footer ? <div className="text-xs text-grayScale-400">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
