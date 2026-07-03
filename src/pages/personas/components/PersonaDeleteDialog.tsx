import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deletePersona } from "../../../api/personas.api"
import { Button } from "../../../components/ui/button"
import { notifyApiError } from "../../../lib/apiErrors"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import type { LmsPersona } from "../../../types/persona.types"

type PersonaDeleteDialogProps = {
  persona: LmsPersona | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function PersonaDeleteDialog({
  persona,
  open,
  onOpenChange,
  onDeleted,
}: PersonaDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!persona) return

    setDeleting(true)
    try {
      const response = await deletePersona(persona.id)
      toast.success(response.message ?? "Persona deleted successfully")
      onOpenChange(false)
      onDeleted?.()
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete persona")
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
            Delete persona?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the persona from the catalog. Practices that referenced it
            will have their persona assignment cleared automatically.
          </DialogDescription>
        </DialogHeader>
        {persona ? (
          <div className="space-y-1 rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-semibold text-grayScale-900">{persona.name}</p>
            <p className="text-xs text-grayScale-500">#{persona.id}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting || !persona}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
