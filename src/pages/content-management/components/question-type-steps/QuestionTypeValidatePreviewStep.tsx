import { useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { validateQuestionTypeDefinition } from "../../../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import { buildCreatePayload } from "../../lib/questionTypeDefinitionValidation"

interface QuestionTypeValidatePreviewStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  onNext: () => void
  onBack: () => void
}

export function QuestionTypeValidatePreviewStep({
  draft,
  onNext,
  onBack,
}: QuestionTypeValidatePreviewStepProps) {
  const [validating, setValidating] = useState(false)
  const [serverOk, setServerOk] = useState<boolean | null>(null)
  const [serverDetail, setServerDetail] = useState<string | null>(null)

  const payload = buildCreatePayload(draft)
  const json = JSON.stringify(payload, null, 2)

  const runValidate = async () => {
    setValidating(true)
    setServerOk(null)
    setServerDetail(null)
    try {
      const res = await validateQuestionTypeDefinition(payload)
      if (!res.valid) {
        setServerOk(false)
        const detail = res.error || res.message || "Validation failed"
        setServerDetail(detail)
        toast.error(res.message || "Invalid question type definition", { description: res.error })
        return
      }
      setServerOk(true)
      setServerDetail(res.message || "Question type definition is valid.")
      toast.success(res.message || "Question type definition is valid")
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">STEP 3: Validate & preview</h2>
          <p className="text-grayScale-500 font-medium mt-1">
            Optional server check via{" "}
            <code className="text-xs bg-grayScale-100 px-1 rounded">POST /questions/validate-question-type-definition</code>
            . Uses the same JSON as create; validity comes from <code className="text-xs bg-grayScale-100 px-1 rounded">data.valid</code>{" "}
            (not the envelope <code className="text-xs bg-grayScale-100 px-1 rounded">success</code> flag).
          </p>
        </div>

        <div className="p-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={runValidate}
              disabled={validating}
              className="h-10"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating…
                </>
              ) : (
                "Validate with server"
              )}
            </Button>
            {serverOk === true ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {serverDetail}
              </span>
            ) : null}
            {serverOk === false ? <span className="text-sm font-medium text-red-600">{serverDetail}</span> : null}
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-grayScale-400">Create payload (JSON)</p>
            <pre className="text-[12px] leading-relaxed font-mono bg-grayScale-900 text-grayScale-50 rounded-xl p-4 overflow-x-auto max-h-[420px] overflow-y-auto">
              {json}
            </pre>
          </div>
        </div>

        <div className="px-4 py-4 border border-grayScale-200 flex items-center justify-between bg-[#F8FAFC]">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-none shadow-none text-grayScale-600 font-bold hover:bg-grayScale-100"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="h-10 px-10 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3"
          >
            Next: Review
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
