import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../../lib/apiErrors"
import { deleteEmailTemplate } from "../../../api/emailTemplates.api"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import type { EmailTemplate } from "../../../types/emailTemplate.types"

type EmailTemplateDeleteDialogProps = {
  template: EmailTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function EmailTemplateDeleteDialog({
  template,
  open,
  onOpenChange,
  onDeleted,
}: EmailTemplateDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!template) return
    if (template.is_system) {
      toast.error("System templates cannot be deleted")
      return
    }

    setDeleting(true)
    try {
      const response = await deleteEmailTemplate(template.id)
      toast.success(response.data?.message ?? "Email template deleted")
      onOpenChange(false)
      onDeleted?.()
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete email template")
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
            Delete email template?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the template. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {template ? (
          <div className="space-y-1 rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-semibold text-grayScale-900">{template.name}</p>
            <p className="break-all font-mono text-xs text-grayScale-500">
              #{template.id} · {template.slug}
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting || !template}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
