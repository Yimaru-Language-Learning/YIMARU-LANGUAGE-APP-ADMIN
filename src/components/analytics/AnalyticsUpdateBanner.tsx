import { CheckCircle2, X } from "lucide-react"
import { createPortal } from "react-dom"
import { formatAppDateTime } from "../../lib/datetime"

export function AnalyticsUpdateBanner({
  updatedAt,
  onDismiss,
}: {
  updatedAt: number | null
  onDismiss: () => void
}) {
  if (updatedAt === null) return null
  // Render outside the layout's scrolling/clipping containers so an update
  // stays visible even when the admin is looking farther down the page.
  return createPortal(
    <div role="status" aria-live="polite" className="fixed inset-x-4 top-20 z-40 flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm text-brand-600 shadow-lg sm:left-auto sm:right-6 sm:w-[440px]">
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">KPI data updated · {formatAppDateTime(new Date(updatedAt).toISOString())}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss update notification" className="rounded p-1 hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>,
    document.body,
  )
}
