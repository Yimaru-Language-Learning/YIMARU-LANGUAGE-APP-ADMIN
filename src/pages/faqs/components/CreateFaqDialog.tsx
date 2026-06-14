import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createFAQ } from "../../../api/faq.api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { getFaqApiErrorMessage } from "../../../lib/faqErrors"
import {
  draftToCreatePayload,
  EMPTY_FAQ_FORM_DRAFT,
  FaqForm,
  validateFaqDraft,
  type FaqFormDraft,
} from "./FaqForm"
import type { FAQStatus } from "../../../types/faq.types"

type CreateFaqDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  suggestedDisplayOrder: number
  onCreated?: () => void
}

export function CreateFaqDialog({
  open,
  onOpenChange,
  categories,
  suggestedDisplayOrder,
  onCreated,
}: CreateFaqDialogProps) {
  const [draft, setDraft] = useState<FaqFormDraft>(EMPTY_FAQ_FORM_DRAFT)
  const [saving, setSaving] = useState(false)
  const [savingAction, setSavingAction] = useState<"draft" | "publish" | null>(null)

  useEffect(() => {
    if (open) {
      setDraft({
        ...EMPTY_FAQ_FORM_DRAFT,
        display_order: String(suggestedDisplayOrder),
      })
      setSavingAction(null)
    }
  }, [open, suggestedDisplayOrder])

  const handleOpenChange = (next: boolean) => {
    if (!next && !saving) onOpenChange(false)
  }

  const handleCreate = async (status: FAQStatus) => {
    const validationError = validateFaqDraft(draft)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    setSavingAction(status === "ACTIVE" ? "publish" : "draft")
    try {
      const response = await createFAQ(draftToCreatePayload(draft, status))
      if (!response.data) {
        throw new Error("Empty create response")
      }
      toast.success(
        status === "ACTIVE"
          ? response.message ?? "FAQ published successfully"
          : response.message ?? "FAQ saved as draft",
      )
      onOpenChange(false)
      onCreated?.()
    } catch (e: unknown) {
      console.error(e)
      toast.error(getFaqApiErrorMessage(e, "Failed to create FAQ"))
    } finally {
      setSaving(false)
      setSavingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-500" />
            New FAQ
          </DialogTitle>
          <DialogDescription>
            Add a question and answer for the learner help center.
          </DialogDescription>
        </DialogHeader>

        <FaqForm
          draft={draft}
          saving={saving}
          savingAction={savingAction}
          categories={categories}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onSaveDraft={() => void handleCreate("INACTIVE")}
          onPublish={() => void handleCreate("ACTIVE")}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
