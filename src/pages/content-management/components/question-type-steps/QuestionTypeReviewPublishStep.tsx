import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import {
  createQuestionTypeDefinition,
  extractDefinitionMutationId,
  updateQuestionTypeDefinition,
  validateQuestionTypeDefinition,
} from "../../../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import { buildCreatePayload } from "../../lib/questionTypeDefinitionValidation"

interface QuestionTypeReviewPublishStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  onBack: () => void
  /** When set, saves via PUT /questions/type-definitions/:id */
  editDefinitionId?: number | null
}

export function QuestionTypeReviewPublishStep({
  draft,
  onBack,
  editDefinitionId,
}: QuestionTypeReviewPublishStepProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const isEdit = editDefinitionId != null && editDefinitionId > 0

  const payload = buildCreatePayload(draft)

  const submit = async (status: "ACTIVE" | "INACTIVE") => {
    const body = { ...payload, status }
    setSubmitting(true)
    try {
      if (isEdit) {
        const res = await updateQuestionTypeDefinition(editDefinitionId, body)
        const id = extractDefinitionMutationId(res) ?? editDefinitionId
        toast.success(res.data?.message || "Question type definition updated", {
          description: `Definition id: ${id}`,
        })
        navigate(`/new-content/question-types?updated=${id}`)
        return
      }

      const validation = await validateQuestionTypeDefinition(body)
      if (!validation.valid) {
        toast.error(validation.message || "Invalid question type definition", {
          description: validation.error ? String(validation.error) : undefined,
        })
        return
      }

      const res = await createQuestionTypeDefinition(body)
      const id = extractDefinitionMutationId(res)
      if (id == null) {
        toast.error(
          res.data?.message ?? "Definition may not have been created: response did not include an id.",
        )
        return
      }
      toast.success(res.data?.message || "Question type definition created", {
        description: `Definition id: ${id}`,
      })
      navigate(`/new-content/question-types?created=${id}`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } }
      const msg =
        err.response?.data?.message ||
        (e instanceof Error ? e.message : isEdit ? "Update failed" : "Create failed")
      const detail = err.response?.data?.error
      toast.error(String(msg), { description: detail ? String(detail) : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">STEP 4: Review & publish</h2>
          <p className="text-grayScale-500 font-medium mt-1">
            {isEdit ? (
              <>
                Confirm changes, then update via{" "}
                <code className="text-xs bg-grayScale-100 px-1 rounded">
                  PUT /questions/type-definitions/{editDefinitionId}
                </code>
                .
              </>
            ) : (
              <>
                Confirm details, then create via{" "}
                <code className="text-xs bg-grayScale-100 px-1 rounded">POST /questions/type-definitions</code>.
              </>
            )}
          </p>
        </div>

        <div className="p-10 space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Key</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.key}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Display name</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.display_name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Description</dt>
              <dd className="font-medium text-grayScale-800 mt-1">{payload.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Status</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{draft.status}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Stimulus kinds</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.stimulus_component_kinds.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Response kinds</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.response_component_kinds.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Stimulus schema rows</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.stimulus_schema.length}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Response schema rows</dt>
              <dd className="font-medium text-grayScale-900 mt-1">{payload.response_schema.length}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={submitting}
              onClick={() => void submit("INACTIVE")}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save as inactive" : "Save as inactive (draft)"}
            </Button>
            <Button
              type="button"
              className="h-11 bg-[#9E2891] hover:bg-[#8A237E] text-white"
              disabled={submitting}
              onClick={() => void submit("ACTIVE")}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save as active" : "Create as active"}
            </Button>
          </div>
        </div>

        <div className="px-4 py-4 border border-grayScale-200 flex items-center justify-start bg-[#F8FAFC]">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-none shadow-none text-grayScale-600 font-bold hover:bg-grayScale-100"
            onClick={onBack}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Back
          </Button>
        </div>
      </Card>
    </div>
  )
}
