import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
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
  currentStep?: number
  onChange: (patch: Partial<FaqFormDraft>) => void
  onStepChange?: (step: number) => void
  onSaveDraft: () => void
  onPublish: () => void
  onCancel: () => void
}

export function FaqForm({
  draft,
  saving,
  savingAction = null,
  categories,
  currentStep = 2,
  onChange,
  onStepChange,
  onSaveDraft,
  onPublish,
  onCancel,
}: FaqFormProps) {
  const stepped = Boolean(onStepChange)
  const showAll = !stepped

  const canContinue =
    currentStep === 1
      ? draft.question.trim().length > 0 && draft.answer.trim().length > 0
      : true

  return (
    <div className="flex max-h-[calc(90vh-140px)] flex-col overflow-hidden">
      <div className="space-y-5 overflow-y-auto px-6 py-5">
        {(showAll || currentStep === 1) && (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
                Question <span className="text-brand-500">*</span>
              </label>
              <Input
                value={draft.question}
                onChange={(e) => onChange({ question: e.target.value })}
                placeholder="How do I reset my password?"
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
                Answer <span className="text-brand-500">*</span>
              </label>
              <Textarea
                value={draft.answer}
                onChange={(e) => onChange({ answer: e.target.value })}
                placeholder="Go to login and click 'Forgot Password'."
                rows={6}
                disabled={saving}
              />
              <p className="mt-1 text-[11px] text-grayScale-400">Plain text only.</p>
            </div>
          </>
        )}

        {(showAll || currentStep === 2) && (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
                Category
              </label>
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
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
                Display order
              </label>
              <Input
                type="number"
                min={0}
                value={draft.display_order}
                onChange={(e) => onChange({ display_order: e.target.value })}
                disabled={saving}
              />
              <p className="mt-1 text-[11px] text-grayScale-400">
                Lower numbers appear first.
              </p>
            </div>

            {showAll && (
              <div className="rounded-[8px] border border-grayScale-100 bg-grayScale-50/70 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                  Preview
                </p>
                <p className="mt-2 text-sm font-medium text-grayScale-900">
                  {draft.question || "unassigned"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-grayScale-600">
                  {draft.answer || "unassigned"}
                </p>
                {(draft.category || draft.display_order) && (
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-grayScale-400">
                    {draft.category && <span>Category: {draft.category}</span>}
                    {draft.display_order && <span>Order: {draft.display_order}</span>}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {stepped && currentStep === 2 && (
          <div className="rounded-[8px] border border-grayScale-100 bg-grayScale-50/70 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
              Preview
            </p>
            <p className="mt-2 text-sm font-medium text-grayScale-900">
              {draft.question || "unassigned"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-grayScale-600">
              {draft.answer || "unassigned"}
            </p>
            {(draft.category || draft.display_order) && (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-grayScale-400">
                {draft.category && <span>Category: {draft.category}</span>}
                {draft.display_order && <span>Order: {draft.display_order}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-grayScale-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          {stepped && currentStep === 2 && (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => onStepChange?.(1)}
            >
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stepped && currentStep === 1 ? (
            <Button
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={!canContinue}
              onClick={() => onStepChange?.(2)}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={saving}
                onClick={onSaveDraft}
              >
                {saving && savingAction === "draft" ? "Saving…" : "Save as draft"}
              </Button>
              <Button
                className="bg-brand-500 text-white hover:bg-brand-600"
                disabled={saving}
                onClick={onPublish}
              >
                {saving && savingAction === "publish" ? "Publishing…" : "Publish"}
              </Button>
            </>
          )}
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
