import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteFAQ } from "../../../api/faq.api"
import { Button } from "../../../components/ui/button"
import { getFaqApiErrorMessage } from "../../../lib/faqErrors"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
      const msg = getFaqApiErrorMessage(e, "Failed to delete FAQ")
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-grayScale-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Trash2 className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            Delete FAQ?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the FAQ from the help center. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {faq ? (
          <div className="space-y-1 rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-semibold text-grayScale-900">{faq.question}</p>
            <p className="text-xs text-grayScale-500">#{faq.id}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
