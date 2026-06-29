import { EXPORT_MAX_ROWS } from "../../lib/csv-export"

type ExportTruncationWarningProps = {
  totalCount?: number
}

export function ExportTruncationWarning({ totalCount }: ExportTruncationWarningProps) {
  if (totalCount == null || totalCount <= EXPORT_MAX_ROWS) return null

  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      More than {EXPORT_MAX_ROWS.toLocaleString()} rows match. CSV export includes at most{" "}
      {EXPORT_MAX_ROWS.toLocaleString()} rows. Narrow your filters for a complete extract.
    </p>
  )
}
