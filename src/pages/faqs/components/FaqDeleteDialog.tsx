import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteFAQ } from "../../../api/faq.api"
import { Button } from "../../../components/ui/button"
import { notifyApiError } from "../../../lib/apiErrors"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../components/ui/dialog"
import type { FAQ } from "../../../types/faq.types"

type FaqDeleteDialogProps = {
  faq: FAQ | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function FaqDeleteDialog({
  faq,
  open,
  onOpenChange,
  onDeleted,
}: FaqDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!faq) return

    setDeleting(true)
    try {
      const response = await deleteFAQ(faq.id)
      toast.success(response.message ?? "FAQ deleted successfully")
      onOpenChange(false)
      onDeleted?.()
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete FAQ")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-grayScale-100 px-6 py-5 pr-14">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-red-50 dark:bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <DialogTitle className="text-[15px] font-semibold text-grayScale-900">
              Delete FAQ?
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-grayScale-500">
              This permanently removes the FAQ from the help center.
            </DialogDescription>
          </div>
        </div>
        {faq ? (
          <div className="mx-6 mt-4 rounded-[8px] border border-grayScale-100 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-medium text-grayScale-900">{faq.question}</p>
            <p className="mt-0.5 text-[11px] text-grayScale-400">#{faq.id}</p>
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2 border-t border-grayScale-100 px-6 py-4">
          <Button
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting || !faq}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete FAQ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
