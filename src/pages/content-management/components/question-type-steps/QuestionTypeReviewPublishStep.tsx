import { useEffect, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { notifyApiError } from "../../../../lib/apiErrors"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import {
  createQuestionTypeDefinition,
  extractDefinitionMutationId,
  updateQuestionTypeDefinition,
  validateQuestionTypeDefinition,
} from "../../../../api/questionTypeDefinitions.api"
import { getQuestionTypeDefinitionGroups } from "../../../../api/questionTypeDefinitionGroups.api"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import {
  buildCreatePayload,
  buildValidateKindsPayload,
  inferRuntimeQuestionType,
} from "../../lib/questionTypeDefinitionValidation"
import { slotLabel } from "./componentKindUi"
import { questionTypeGroupLabels } from "../../../../lib/questionTypeGroupIds"

interface QuestionTypeReviewPublishStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  onBack: () => void
  /** When set, saves via PUT /questions/type-definitions/:id */
  editDefinitionId?: number | null
  isSystem?: boolean
  saveDisabled?: boolean
}

export function QuestionTypeReviewPublishStep({
  draft,
  onBack,
  editDefinitionId,
  isSystem,
  saveDisabled = false,
}: QuestionTypeReviewPublishStepProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [groupName, setGroupName] = useState<string>("")
  const isEdit = editDefinitionId != null && editDefinitionId > 0

  const payload = buildCreatePayload(draft)
  const runtime = inferRuntimeQuestionType(payload.key, payload.response_component_kinds)

  useEffect(() => {
    if (!payload.group_ids?.length) {
      setGroupName("Ungrouped")
      return
    }
    getQuestionTypeDefinitionGroups()
      .then((res) => {
        setGroupName(questionTypeGroupLabels(payload.group_ids, res.groups))
      })
      .catch(() => {
        setGroupName(payload.group_ids!.map((id) => `Group #${id}`).join(", "))
      })
  }, [payload.group_ids])

  const submit = async (status: "ACTIVE" | "INACTIVE") => {
    if (isEdit && saveDisabled) return
    const body = { ...payload, status }
    setSubmitting(true)
    try {
      const validation = await validateQuestionTypeDefinition(buildValidateKindsPayload(draft))
      if (!validation.valid) {
        toast.error(validation.message || "Invalid question type definition", {
          description: validation.error ? String(validation.error) : undefined,
        })
        return
      }

      if (isEdit) {
        const res = await updateQuestionTypeDefinition(editDefinitionId, body)
        const id = extractDefinitionMutationId(res) ?? editDefinitionId
        toast.success(res.data?.message || "Question type definition updated", {
          description: `Definition id: ${id}`,
        })
        navigate(`/new-content/question-types?updated=${id}`)
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
      notifyApiError(e, isEdit ? "Update failed" : "Create failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white dark:bg-grayScale-50">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900 dark:text-grayScale-600">STEP 4: Review &amp; publish</h2>
          <p className="text-grayScale-500 dark:text-grayScale-400 font-medium mt-1">
            {isEdit
              ? "Confirm your changes and save. The definition key cannot be changed."
              : "Confirm your definition, then save it for use when authoring practice questions."}
          </p>
        </div>

        <div className="p-10 space-y-6">
          {isSystem ? (
            <p className="text-sm font-medium text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              This is a system definition. You can update it, but it cannot be deleted from the library.
            </p>
          ) : null}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Key</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1 font-mono text-[13px]">{payload.key}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Display name</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{payload.display_name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Description</dt>
              <dd className="font-medium text-grayScale-800 dark:text-grayScale-500 mt-1">{payload.description || "unassigned"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Groups</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{groupName || "unassigned"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Status</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{draft.status}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Runtime type</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{runtime ?? "unassigned"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Stimulus kinds</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{payload.stimulus_component_kinds.join(", ") || "unassigned"}</dd>
            </div>
            <div>
              <dt className="text-grayScale-400 font-semibold uppercase text-[11px] tracking-wide">Response kinds</dt>
              <dd className="font-medium text-grayScale-900 dark:text-grayScale-600 mt-1">{payload.response_component_kinds.join(", ") || "unassigned"}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SchemaSlotSummary title="Stimulus schema" rows={payload.stimulus_schema} />
            <SchemaSlotSummary title="Response schema" rows={payload.response_schema} />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={submitting || (isEdit && saveDisabled)}
              onClick={() => void submit("INACTIVE")}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                "Save as inactive"
              ) : (
                "Save as inactive (draft)"
              )}
            </Button>
            <Button
              type="button"
              className="h-11 bg-[#9E2891] hover:bg-[#8A237E] text-white"
              disabled={submitting || (isEdit && saveDisabled)}
              onClick={() => void submit("ACTIVE")}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                "Save as active"
              ) : (
                "Create as active"
              )}
            </Button>
          </div>
        </div>

        <div className="px-4 py-4 border border-grayScale-200 flex items-center justify-start bg-[#F8FAFC] dark:bg-grayScale-100">
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

function SchemaSlotSummary({
  title,
  rows,
}: {
  title: string
  rows: { id: string; kind: string; label?: string; required: boolean }[]
}) {
  return (
    <div className="rounded-xl border border-grayScale-100 bg-grayScale-100 dark:bg-grayScale-100 p-4">
      <h4 className="text-[12px] font-bold uppercase tracking-wide text-grayScale-500">{title}</h4>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-grayScale-500">No slots</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="flex flex-wrap gap-x-2 text-grayScale-800 dark:text-grayScale-500">
              <span className="font-medium">{slotLabel(r)}</span>
              <span className="text-grayScale-400">·</span>
              <span className="font-mono text-[11px] text-grayScale-500">{r.id}</span>
              <span className="text-grayScale-400">·</span>
              <span className="text-grayScale-600">{r.kind}</span>
              {r.required ? (
                <span className="text-[10px] font-bold uppercase text-brand-600">required</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
