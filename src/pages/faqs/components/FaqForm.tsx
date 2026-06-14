import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { faqStatusBadgeVariant, faqStatusLabel } from "../../../lib/faqDisplay"
import type { FAQStatus } from "../../../types/faq.types"

export type FaqFormDraft = {
  question: string
  answer: string
  category: string
  display_order: string
}

export const EMPTY_FAQ_FORM_DRAFT: FaqFormDraft = {
  question: "",
  answer: "",
  category: "",
  display_order: "0",
}

type FaqFormProps = {
  draft: FaqFormDraft
  saving: boolean
  savingAction?: "draft" | "publish" | null
  categories: string[]
  currentStatus?: FAQStatus
  onChange: (patch: Partial<FaqFormDraft>) => void
  onSaveDraft: () => void
  onPublish: () => void
  onCancel: () => void
}

export function FaqForm({
  draft,
  saving,
  savingAction = null,
  categories,
  currentStatus,
  onChange,
  onSaveDraft,
  onPublish,
  onCancel,
}: FaqFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Question
        </p>
        <Textarea
          value={draft.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="How do I reset my password?"
          rows={2}
          disabled={saving}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Answer
        </p>
        <Textarea
          value={draft.answer}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder="Go to login and click 'Forgot Password'."
          rows={6}
          disabled={saving}
        />
        <p className="mt-1 text-xs text-grayScale-400">Plain text only.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
            Category
          </p>
          <Input
            value={draft.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="Account"
            list="faq-category-suggestions"
            disabled={saving}
          />
          {categories.length > 0 ? (
            <datalist id="faq-category-suggestions">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
            Display order
          </p>
          <Input
            type="number"
            min={0}
            value={draft.display_order}
            onChange={(e) => onChange({ display_order: e.target.value })}
            disabled={saving}
          />
          <p className="mt-1 text-xs text-grayScale-400">
            Lower numbers appear first.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grayScale-100 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          {currentStatus ? (
            <Badge variant={faqStatusBadgeVariant(currentStatus)}>
              Currently {faqStatusLabel(currentStatus)}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={onSaveDraft}
          >
            {saving && savingAction === "draft" ? "Saving draft…" : "Save as draft"}
          </Button>
          <Button
            className="bg-brand-500 text-white hover:bg-brand-600"
            disabled={saving}
            onClick={onPublish}
          >
            {saving && savingAction === "publish" ? "Publishing…" : "Publish FAQ"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function validateFaqDraft(draft: FaqFormDraft): string | null {
  if (!draft.question.trim()) return "Question is required"
  if (!draft.answer.trim()) return "Answer is required"
  const order = Number(draft.display_order)
  if (!Number.isFinite(order) || order < 0) {
    return "Display order must be a non-negative number"
  }
  return null
}

export function draftToCreatePayload(draft: FaqFormDraft, status: FAQStatus) {
  const category = draft.category.trim()
  return {
    question: draft.question.trim(),
    answer: draft.answer.trim(),
    category: category || null,
    display_order: Number(draft.display_order),
    status,
  }
}

export function draftToUpdatePayload(draft: FaqFormDraft, status: FAQStatus) {
  return draftToCreatePayload(draft, status)
}
