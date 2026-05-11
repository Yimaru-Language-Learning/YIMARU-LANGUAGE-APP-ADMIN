import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Hourglass,
} from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { Input } from "../../../../components/ui/input"
import type { QuestionTypeDefinitionCreatePayload } from "../../../../types/questionTypeDefinition.types"
import type { FieldErrorMap } from "../../lib/questionTypeDefinitionValidation"
import { SchemaBuilderSection } from "./SchemaBuilderSection"
import { ComponentKindCard } from "./ComponentKindCard"
import { getResponseKindPresentation, getStimulusKindPresentation } from "./componentKindUi"

interface QuestionTypeConfigStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  setDraft: React.Dispatch<React.SetStateAction<QuestionTypeDefinitionCreatePayload>>
  versionName: string
  setVersionName: (v: string) => void
  stimulusCatalogKinds: string[]
  responseCatalogKinds: string[]
  catalogLoading: boolean
  catalogError: string | null
  errors: FieldErrorMap
  onNext: () => void
  onBack: () => void
}

function toggleKind(list: string[], kind: string): string[] {
  return list.includes(kind) ? list.filter((k) => k !== kind) : [...list, kind]
}

function rowErrorMap(side: "stimulus" | "response", errors: FieldErrorMap): Record<number, string> {
  const prefix = `${side}_`
  const out: Record<number, string> = {}
  Object.entries(errors).forEach(([k, v]) => {
    if (!k.startsWith(prefix)) return
    const rest = k.slice(prefix.length)
    const m = /^(\d+)$/.exec(rest)
    if (m) out[Number(m[1])] = v
  })
  return out
}

export function QuestionTypeConfigStep({
  draft,
  setDraft,
  versionName,
  setVersionName,
  stimulusCatalogKinds,
  responseCatalogKinds,
  catalogLoading,
  catalogError,
  errors,
  onNext,
  onBack,
}: QuestionTypeConfigStepProps) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const title = draft.display_name?.trim() || "Untitled definition"

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-6xl mx-auto overflow-hidden border border-grayScale-200 shadow-sm rounded-2xl bg-white">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-violet-100/90 hover:bg-violet-100 border-b border-violet-200/80 text-left transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center text-violet-700 shrink-0 shadow-sm">
              <Hourglass className="h-5 w-5" />
            </div>
            <span className="text-[17px] font-bold text-grayScale-900 truncate">{title}</span>
          </div>
          {panelOpen ? (
            <ChevronUp className="h-5 w-5 text-grayScale-600 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-grayScale-600 shrink-0" />
          )}
        </button>

        {panelOpen ? (
          <div className="p-6 sm:p-10 space-y-10">
            <div className="space-y-2 max-w-xl">
              <label className="text-[14px] font-semibold text-grayScale-700">
                Version name <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-11 rounded-[10px] border-grayScale-200 bg-[#F8FAFC]"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g. Test 1"
              />
              {errors.version_name ? (
                <p className="text-sm font-medium text-red-600">{errors.version_name}</p>
              ) : null}
              <p className="text-[12px] text-grayScale-400">
                Local label for this authoring pass (not sent to the API unless you add it to description later).
              </p>
            </div>

            {catalogLoading ? (
              <p className="text-sm text-grayScale-500">Loading component catalog…</p>
            ) : catalogError ? (
              <p className="text-sm text-red-600">{catalogError}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
                <section className="space-y-4 min-w-0 lg:pr-2 lg:border-r lg:border-grayScale-200/90">
                  <div>
                    <h3 className="text-[13px] font-bold text-grayScale-500 uppercase tracking-[0.12em]">
                      Section A: Question input types
                    </h3>
                    <p className="text-[14px] text-grayScale-500 mt-1 font-medium">
                      Choose how the question is presented to the learner.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {stimulusCatalogKinds.map((kind) => {
                      const { label, Icon } = getStimulusKindPresentation(kind)
                      const selected = draft.stimulus_component_kinds.includes(kind)
                      return (
                        <ComponentKindCard
                          key={kind}
                          label={label}
                          Icon={Icon}
                          selected={selected}
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              stimulus_component_kinds: toggleKind(d.stimulus_component_kinds, kind),
                            }))
                          }
                        />
                      )
                    })}
                  </div>
                  {errors.stimulus_kinds ? (
                    <p className="text-sm font-medium text-red-600">{errors.stimulus_kinds}</p>
                  ) : null}
                </section>

                <section className="space-y-4 min-w-0 lg:pl-2">
                  <div>
                    <h3 className="text-[13px] font-bold text-grayScale-500 uppercase tracking-[0.12em]">
                      Section B: Answer types
                    </h3>
                    <p className="text-[14px] text-grayScale-500 mt-1 font-medium">
                      How should the student answer this question?
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {responseCatalogKinds.map((kind) => {
                      const { label, Icon } = getResponseKindPresentation(kind)
                      const selected = draft.response_component_kinds.includes(kind)
                      return (
                        <ComponentKindCard
                          key={kind}
                          label={label}
                          Icon={Icon}
                          selected={selected}
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              response_component_kinds: toggleKind(d.response_component_kinds, kind),
                            }))
                          }
                        />
                      )
                    })}
                  </div>
                  {errors.response_kinds ? (
                    <p className="text-sm font-medium text-red-600">{errors.response_kinds}</p>
                  ) : null}
                </section>
              </div>
            )}

            <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-[14px] font-bold text-grayScale-700 hover:bg-grayScale-100/80 transition-colors"
              >
                Advanced: edit schema rows (optional)
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>
              {advancedOpen ? (
                <div className="px-4 pb-6 pt-2 space-y-10 border-t border-grayScale-200 bg-white">
                  <SchemaBuilderSection
                    title="Stimulus schema"
                    side="stimulus"
                    allowedKinds={draft.stimulus_component_kinds}
                    catalogKinds={stimulusCatalogKinds}
                    rows={draft.stimulus_schema}
                    onChange={(rows) => setDraft((d) => ({ ...d, stimulus_schema: rows }))}
                    error={errors.stimulus_schema}
                    rowErrors={rowErrorMap("stimulus", errors)}
                  />
                  <SchemaBuilderSection
                    title="Response schema"
                    side="response"
                    allowedKinds={draft.response_component_kinds}
                    catalogKinds={responseCatalogKinds}
                    rows={draft.response_schema}
                    onChange={(rows) => setDraft((d) => ({ ...d, response_schema: rows }))}
                    error={errors.response_schema}
                    rowErrors={rowErrorMap("response", errors)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="px-4 py-4 border-t border-grayScale-200 flex items-center justify-between bg-[#F8FAFC]">
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
            Next: Validate
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
