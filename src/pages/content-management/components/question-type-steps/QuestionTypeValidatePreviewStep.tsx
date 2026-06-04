import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { validateQuestionTypeDefinition } from "../../../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import {
  buildCreatePayload,
  buildValidateKindsPayload,
} from "../../lib/questionTypeDefinitionValidation"
import { DefinitionRuntimeHint } from "./DefinitionRuntimeHint"

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

  const runValidate = useCallback(async () => {
    setValidating(true)
    setServerOk(null)
    setServerDetail(null)
    try {
      const res = await validateQuestionTypeDefinition(buildValidateKindsPayload(draft))
      if (!res.valid) {
        setServerOk(false)
        const detail = res.error || res.message || "Validation failed"
        setServerDetail(detail)
        toast.error(res.message || "Invalid question type definition", { description: res.error })
        return
      }
      setServerOk(true)
      setServerDetail(res.message || "Component kinds are valid.")
      toast.success(res.message || "Definition kinds validated")
    } finally {
      setValidating(false)
    }
  }, [draft])

  useEffect(() => {
    void runValidate()
  }, [runValidate])

  const handleNext = () => {
    if (serverOk !== true) {
      toast.error("Validate with the server before continuing.", {
        description: serverDetail || "Fix response/stimulus kinds and try again.",
      })
      return
    }
    onNext()
  }

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">STEP 3: Validate</h2>
          <p className="text-grayScale-500 font-medium mt-1">
            We check that your stimulus and response selections are valid before you continue. You must pass
            validation before review.
          </p>
        </div>

        <div className="p-10 space-y-6">
          <DefinitionRuntimeHint
            definitionKey={payload.key}
            responseKinds={payload.response_component_kinds}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void runValidate()}
              disabled={validating}
              className="h-10"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating…
                </>
              ) : (
                "Re-validate"
              )}
            </Button>
            {serverOk === true ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {serverDetail}
              </span>
            ) : null}
            {serverOk === false ? (
              <span className="text-sm font-medium text-red-600">{serverDetail}</span>
            ) : validating ? (
              <span className="text-sm text-grayScale-500">Checking kinds with server…</span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm rounded-xl border border-grayScale-100 bg-grayScale-50/60 p-4">
            <div>
              <dt className="text-[11px] font-bold uppercase text-grayScale-400">Stimulus kinds</dt>
              <dd className="mt-1 font-medium text-grayScale-800">
                {payload.stimulus_component_kinds.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-grayScale-400">Response kinds</dt>
              <dd className="mt-1 font-medium text-grayScale-800">
                {payload.response_component_kinds.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-grayScale-400">Stimulus slots</dt>
              <dd className="mt-1 font-medium text-grayScale-800">{payload.stimulus_schema.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-grayScale-400">Response slots</dt>
              <dd className="mt-1 font-medium text-grayScale-800">{payload.response_schema.length}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-grayScale-400">
              Definition preview
            </p>
            <pre className="text-[12px] leading-relaxed font-mono bg-grayScale-900 text-grayScale-50 rounded-xl p-4 overflow-x-auto max-h-[360px] overflow-y-auto">
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
            onClick={handleNext}
            disabled={validating || serverOk !== true}
            className="h-10 px-10 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] disabled:opacity-50 transition-all flex items-center gap-3"
          >
            Next: Review & publish
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
