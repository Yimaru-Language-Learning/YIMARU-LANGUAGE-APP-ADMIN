import { AlertTriangle, Info } from "lucide-react"
import { inferRuntimeQuestionType } from "../../lib/questionTypeDefinitionValidation"

export function DefinitionRuntimeHint({
  definitionKey,
  responseKinds,
}: {
  definitionKey: string
  responseKinds: string[]
}) {
  const runtime = inferRuntimeQuestionType(definitionKey, responseKinds)

  if (runtime == null) {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">May not be publishable</p>
          <p className="mt-0.5 text-amber-800/90">
            The server requires a mappable runtime question type. Add at least one non-timer response
            kind (e.g. OPTION, TEXT_INPUT). Timer-only definitions are rejected.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-grayScale-800">
      <Info className="h-5 w-5 shrink-0 text-brand-500" />
      <div>
        <p className="font-semibold text-grayScale-900">
          Stored as: {runtime === "DYNAMIC" ? "dynamic question" : runtime.replace(/_/g, " ").toLowerCase()}
        </p>
        <p className="mt-0.5 text-grayScale-600">
          {runtime === "DYNAMIC"
            ? "Practice questions built from this type use the dynamic question builder."
            : "Questions built from this type use the classic question format for this kind."}
        </p>
      </div>
    </div>
  )
}
