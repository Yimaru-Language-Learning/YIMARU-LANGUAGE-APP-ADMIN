import { notifyApiError } from "../../lib/apiErrors"
import { Download } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTeamPermissions } from "../../hooks/useTeamPermissions"
import { downloadCsvExport, type QueryParams } from "../../lib/csv-export"
import { hasExportPermission } from "../../lib/exportPermissions"
import { Button } from "../ui/button"
import { SpinnerIcon } from "../ui/spinner-icon"
import { cn } from "../../lib/utils"

type ExportCsvButtonProps = {
  permission: string
  exportPath: string
  params: QueryParams
  /** Defaults from export path when omitted (e.g. payments → payments_2026-06-23_14-30-00.csv). */
  resourceName?: string
  disabled?: boolean
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportCsvButton({
  permission,
  exportPath,
  params,
  resourceName,
  disabled = false,
  className,
  variant = "outline",
  size = "default",
}: ExportCsvButtonProps) {
  const { permissions, loading: permLoading } = useTeamPermissions()
  const [exporting, setExporting] = useState(false)

  const canExport = hasExportPermission(permission, permissions)

  if (permLoading || !canExport) return null

  async function handleExport() {
    setExporting(true)
    try {
      const filename = await downloadCsvExport(exportPath, params, { resourceName })
      toast.success(`Downloaded ${filename}`)
    } catch (e) {
      notifyApiError(e, "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("shrink-0 gap-2", className)}
      disabled={disabled || exporting}
      onClick={() => void handleExport()}
    >
      {exporting ? <SpinnerIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {exporting ? "Exporting…" : "Export CSV"}
    </Button>
  )
}
