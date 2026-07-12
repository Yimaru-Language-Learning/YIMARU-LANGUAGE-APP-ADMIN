import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteAppVersion } from "../../../api/app-versions.api"
import { notifyApiError } from "../../../lib/apiErrors"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { formatAppPlatform, versionLabel } from "../../../lib/appVersions"
import type { AppVersion } from "../../../types/app-version.types"

type DeleteAppVersionDialogProps = {
  version: AppVersion | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (id: number) => void
}

export function DeleteAppVersionDialog({
  version,
  open,
  onOpenChange,
  onDeleted,
}: DeleteAppVersionDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!version) return

    setDeleting(true)
    try {
      const res = await deleteAppVersion(version.id)
      toast.success(res.message || "App version deleted successfully")
      onDeleted(version.id)
      onOpenChange(false)
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete app version")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-[12px] border border-grayScale-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Trash2 className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            Delete app version?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the release record. Learners will no longer receive update
            prompts for this version entry. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {version ? (
          <div className="space-y-1 rounded-[8px] border border-grayScale-100 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-semibold text-grayScale-900">{versionLabel(version)}</p>
            <p className="text-xs text-grayScale-500">
              #{version.id} · {formatAppPlatform(version.platform)}
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            className="rounded-[6px]"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-[6px]"
            disabled={deleting || !version}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
