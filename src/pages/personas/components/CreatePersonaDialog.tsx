import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createPersona } from "../../../api/personas.api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { getPersonaApiErrorMessage } from "../../../lib/personasErrors"
import {
  draftToCreatePayload,
  EMPTY_PERSONA_FORM_DRAFT,
  PersonaForm,
  PersonaFormActions,
  validatePersonaDraft,
  type PersonaFormDraft,
} from "./PersonaForm"

type CreatePersonaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreatePersonaDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePersonaDialogProps) {
  const [draft, setDraft] = useState<PersonaFormDraft>(EMPTY_PERSONA_FORM_DRAFT)
  const [saving, setSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const busy = saving || uploadingPicture

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_PERSONA_FORM_DRAFT)
      setUploadingPicture(false)
    }
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (!next && !busy) onOpenChange(false)
  }

  const handleCreate = async () => {
    const validationError = validatePersonaDraft(draft)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const response = await createPersona(draftToCreatePayload(draft))
      if (!response.data) throw new Error("Empty create response")
      toast.success(response.message ?? "Persona created successfully")
      onOpenChange(false)
      onCreated?.()
    } catch (e: unknown) {
      console.error(e)
      toast.error(getPersonaApiErrorMessage(e, "Failed to create persona"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-grayScale-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Plus className="h-5 w-5 text-brand-600" />
            New persona
          </DialogTitle>
          <DialogDescription>
            Create a coach/character profile for linking to practice shells.
          </DialogDescription>
        </DialogHeader>

        <PersonaForm
          draft={draft}
          onChange={setDraft}
          disabled={busy}
          onUploadBusyChange={setUploadingPicture}
        />
        <PersonaFormActions
          saving={busy}
          onCancel={() => onOpenChange(false)}
          onSave={() => void handleCreate()}
          saveLabel="Create persona"
        />
      </DialogContent>
    </Dialog>
  )
}
