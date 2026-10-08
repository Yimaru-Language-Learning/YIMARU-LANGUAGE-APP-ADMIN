import { CheckCircle2, X } from "lucide-react"
import { formatAppDateTime } from "../../lib/datetime"

export function AnalyticsUpdateBanner({
  updatedAt,
  onDismiss,
}: {
  updatedAt: number | null
  onDismiss: () => void
}) {
  if (updatedAt === null) return null
  return (
    <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-100/40 px-3 py-2 text-sm text-brand-600">
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">KPI data updated · {formatAppDateTime(new Date(updatedAt).toISOString())}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss update notification" className="rounded p-1 hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
