import { ArrowRight } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { Input } from "../../../../components/ui/input"
import { Textarea } from "../../../../components/ui/textarea"
import { Select } from "../../../../components/ui/select"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import type { FieldErrorMap } from "../../lib/questionTypeDefinitionValidation"

interface QuestionTypeBasicInfoStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  setDraft: React.Dispatch<React.SetStateAction<QuestionTypeDefinitionCreatePayload>>
  errors: FieldErrorMap
  onNext: () => void
  /** When editing an existing definition, the key is immutable on the server */
  keyReadOnly?: boolean
}

export function QuestionTypeBasicInfoStep({
  draft,
  setDraft,
  errors,
  onNext,
  keyReadOnly,
}: QuestionTypeBasicInfoStepProps) {
  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">STEP 1: Definition basics</h2>
          <p className="text-grayScale-500 font-medium mt-1">
            Set the reusable key, display name, and status. On the next step you will choose how questions are
            presented and how learners answer.
          </p>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-grayScale-700 flex items-center gap-1">
                Key <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] disabled:opacity-70"
                placeholder="e.g. dynamic_visual_mcq_001"
                value={draft.key}
                onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                readOnly={keyReadOnly}
                disabled={keyReadOnly}
              />
              {errors.key ? <p className="text-sm text-red-600">{errors.key}</p> : null}
              <p className="text-grayScale-400 text-[13px] font-medium">
                {keyReadOnly
                  ? "Key cannot be changed when editing an existing definition."
                  : "Unique slug-like identifier stored on the definition."}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-medium text-grayScale-700 flex items-center gap-1">
                Display name <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC]"
                placeholder="e.g. Speak About the Photo"
                value={draft.display_name}
                onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
              />
              {errors.display_name ? <p className="text-sm text-red-600">{errors.display_name}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-medium text-grayScale-700">Description</label>
            <Textarea
              className="min-h-[100px] rounded-[12px] border-grayScale-300 bg-[#F8FAFC]"
              placeholder="Optional description for admins"
              value={draft.description ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <label className="text-[14px] font-medium text-grayScale-700 flex items-center gap-1">
              Status <span className="text-red-500">*</span>
            </label>
            <Select
              className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC]"
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  status: e.target.value === "INACTIVE" ? "INACTIVE" : "ACTIVE",
                }))
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive (draft)</option>
            </Select>
          </div>
        </div>

        <div className="px-4 py-4 border border-grayScale-200 flex items-center justify-end bg-[#F8FAFC]">
          <Button
            type="button"
            onClick={onNext}
            className="h-10 px-10 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3"
          >
            Next: Input and answer types
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
