import { useCallback, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { getPersonaById, updatePersona } from "../../../api/personas.api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { getPersonaApiErrorMessage } from "../../../lib/personasErrors"
import type { LmsPersona } from "../../../types/persona.types"
import {
  draftToUpdatePayload,
  PersonaForm,
  PersonaFormActions,
  personaToDraft,
  validatePersonaDraft,
  type PersonaFormDraft,
} from "./PersonaForm"

type EditPersonaDialogProps = {
  persona: LmsPersona | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function EditPersonaDialog({
  persona,
  open,
  onOpenChange,
  onUpdated,
}: EditPersonaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [draft, setDraft] = useState<PersonaFormDraft | null>(null)
  const busy = saving || uploadingPicture

  const load = useCallback(async () => {
    if (!persona) return

    setLoading(true)
    try {
      const res = await getPersonaById(persona.id)
      if (!res.data) throw new Error("Persona not found")
      setDraft(personaToDraft(res.data))
    } catch (e: unknown) {
      console.error(e)
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast.error("Persona not found")
      } else {
        toast.error(getPersonaApiErrorMessage(e, "Failed to load persona"))
      }
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }, [persona, onOpenChange])

  useEffect(() => {
    if (open && persona) {
      void load()
    } else if (!open) {
      setDraft(null)
      setLoading(false)
      setSaving(false)
      setUploadingPicture(false)
    }
  }, [open, persona, load])

  const handleOpenChange = (next: boolean) => {
    if (!next && !busy && !loading) onOpenChange(false)
  }

  const handleSave = async () => {
    if (!persona || !draft) return

    const validationError = validatePersonaDraft(draft)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const res = await updatePersona(persona.id, draftToUpdatePayload(draft))
      if (!res.data) throw new Error("Empty update response")
      toast.success(res.message ?? "Persona updated successfully")
      onOpenChange(false)
      onUpdated?.()
    } catch (e: unknown) {
      console.error(e)
      toast.error(getPersonaApiErrorMessage(e, "Failed to update persona"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-grayScale-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Pencil className="h-5 w-5 text-brand-600" />
            Edit persona
          </DialogTitle>
          <DialogDescription>
            {persona ? `Update coach profile #${persona.id}` : "Update persona details"}
          </DialogDescription>
        </DialogHeader>

        {loading || !draft ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <SpinnerIcon className="h-6 w-6 text-brand-500" />
            <p className="text-sm text-grayScale-500">Loading persona…</p>
          </div>
        ) : (
          <>
            <PersonaForm
              draft={draft}
              onChange={setDraft}
              disabled={busy}
              previewId={persona?.id}
              onUploadBusyChange={setUploadingPicture}
            />
            <PersonaFormActions
              saving={busy}
              onCancel={() => onOpenChange(false)}
              onSave={() => void handleSave()}
              saveLabel="Save changes"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
