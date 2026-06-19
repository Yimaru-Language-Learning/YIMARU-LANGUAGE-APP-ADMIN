import { useState } from "react"
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { Input } from "../../../../components/ui/input"
import type {
  DynamicElementDefinition,
  QuestionTypeDefinitionCreatePayload,
} from "../../../../types/questionTypeDefinition.types"
import type { FieldErrorMap } from "../../lib/questionTypeDefinitionValidation"
import { SchemaBuilderSection } from "./SchemaBuilderSection"
import { SchemaSlotLabelsPanel } from "./SchemaSlotLabelsPanel"
import { ComponentKindCard } from "./ComponentKindCard"
import {
  defaultLabelForKind,
  getResponseKindPresentation,
  getStimulusKindPresentation,
} from "./componentKindUi"
import {
  isNoInputComponentKind,
  noInputSchemaRow,
} from "../../../../lib/questionComponentKinds"

interface QuestionTypeConfigStepProps {
  draft: QuestionTypeDefinitionCreatePayload
  setDraft: React.Dispatch<React.SetStateAction<QuestionTypeDefinitionCreatePayload>>
  stimulusCatalogKinds: string[]
  responseCatalogKinds: string[]
  catalogLoading: boolean
  catalogError: string | null
  errors: FieldErrorMap
  onNext: () => void
  onBack: () => void
}

function slugFragmentFromKind(kind: string): string {
  const s = (kind || "field").toLowerCase().replace(/[^a-z0-9]+/g, "_")
  return s.replace(/^_|_$/g, "") || "field"
}

function nextUniqueSchemaElementId(rows: DynamicElementDefinition[], kind: string): string {
  const base = slugFragmentFromKind(kind)
  const existing = new Set(rows.map((r) => r.id.trim()).filter(Boolean))
  let n = 1
  let id = `${base}_${n}`
  while (existing.has(id)) {
    n++
    id = `${base}_${n}`
  }
  return id
}

function uniqueKindsFromSchemaRows(rows: DynamicElementDefinition[]): string[] {
  return [...new Set(rows.map((r) => r.kind).filter(Boolean))]
}

function removeLastSlotOfKind(
  rows: DynamicElementDefinition[],
  kind: string,
): DynamicElementDefinition[] {
  let removeIndex = -1
  rows.forEach((row, index) => {
    if (row.kind === kind) removeIndex = index
  })
  if (removeIndex < 0) return rows
  return rows.filter((_, index) => index !== removeIndex)
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
  stimulusCatalogKinds,
  responseCatalogKinds,
  catalogLoading,
  catalogError,
  errors,
  onNext,
  onBack,
}: QuestionTypeConfigStepProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleStimulusKindClick = (kind: string) => {
    setDraft((d) => {
      if (isNoInputComponentKind(kind)) {
        const wasSelected = d.stimulus_component_kinds.includes(kind)
        if (wasSelected) {
          return { ...d, stimulus_component_kinds: [], stimulus_schema: [] }
        }
        return {
          ...d,
          stimulus_component_kinds: [kind],
          stimulus_schema: [noInputSchemaRow()],
        }
      }

      const wasSelected = d.stimulus_component_kinds.includes(kind)
      const baseKinds = d.stimulus_component_kinds.filter((k) => !isNoInputComponentKind(k))
      const stimulus_component_kinds = wasSelected
        ? baseKinds.filter((k) => k !== kind)
        : [...baseKinds, kind]

      if (!wasSelected) {
        const stimulus_schema = d.stimulus_schema.filter((r) => !isNoInputComponentKind(r.kind))
        if (!stimulus_schema.some((r) => r.kind === kind)) {
          stimulus_schema.push({
            id: nextUniqueSchemaElementId(stimulus_schema, kind),
            kind,
            label: defaultLabelForKind(kind),
            required: true,
          })
        }
        return { ...d, stimulus_component_kinds, stimulus_schema }
      }
      return {
        ...d,
        stimulus_component_kinds,
        stimulus_schema: d.stimulus_schema.filter((r) => r.kind !== kind),
      }
    })
  }

  const handleResponseKindClick = (kind: string) => {
    setDraft((d) => {
      if (isNoInputComponentKind(kind)) {
        const wasSelected = d.response_component_kinds.includes(kind)
        if (wasSelected) {
          return { ...d, response_component_kinds: [], response_schema: [] }
        }
        return {
          ...d,
          response_component_kinds: [kind],
          response_schema: [noInputSchemaRow()],
        }
      }

      const wasSelected = d.response_component_kinds.includes(kind)
      const baseKinds = d.response_component_kinds.filter((k) => !isNoInputComponentKind(k))
      const response_component_kinds = wasSelected
        ? baseKinds.filter((k) => k !== kind)
        : [...baseKinds, kind]

      if (!wasSelected) {
        const response_schema = d.response_schema.filter((r) => !isNoInputComponentKind(r.kind))
        if (!response_schema.some((r) => r.kind === kind)) {
          response_schema.push({
            id: nextUniqueSchemaElementId(response_schema, kind),
            kind,
            label: defaultLabelForKind(kind),
            required: true,
          })
        }
        return { ...d, response_component_kinds, response_schema }
      }
      return {
        ...d,
        response_component_kinds,
        response_schema: d.response_schema.filter((r) => r.kind !== kind),
      }
    })
  }

  const addStimulusSlot = (kind: string) => {
    setDraft((d) => {
      if (!d.stimulus_component_kinds.includes(kind)) return d
      const stimulus_schema = [...d.stimulus_schema]
      stimulus_schema.push({
        id: nextUniqueSchemaElementId(stimulus_schema, kind),
        kind,
        label: defaultLabelForKind(kind),
        required: true,
      })
      return { ...d, stimulus_schema }
    })
  }

  const addResponseSlot = (kind: string) => {
    setDraft((d) => {
      if (!d.response_component_kinds.includes(kind)) return d
      const response_schema = [...d.response_schema]
      response_schema.push({
        id: nextUniqueSchemaElementId(response_schema, kind),
        kind,
        label: defaultLabelForKind(kind),
        required: true,
      })
      return { ...d, response_schema }
    })
  }

  const removeStimulusSlot = (kind: string) => {
    setDraft((d) => {
      const stimulus_schema = removeLastSlotOfKind(d.stimulus_schema, kind)
      return {
        ...d,
        stimulus_schema,
        stimulus_component_kinds: uniqueKindsFromSchemaRows(stimulus_schema),
      }
    })
  }

  const removeResponseSlot = (kind: string) => {
    setDraft((d) => {
      const response_schema = removeLastSlotOfKind(d.response_schema, kind)
      return {
        ...d,
        response_schema,
        response_component_kinds: uniqueKindsFromSchemaRows(response_schema),
      }
    })
  }

  const setStimulusSchema = (rows: DynamicElementDefinition[]) => {
    setDraft((d) => ({
      ...d,
      stimulus_schema: rows,
      stimulus_component_kinds: uniqueKindsFromSchemaRows(rows),
    }))
  }

  const setResponseSchema = (rows: DynamicElementDefinition[]) => {
    setDraft((d) => ({
      ...d,
      response_schema: rows,
      response_component_kinds: uniqueKindsFromSchemaRows(rows),
    }))
  }

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-6xl mx-auto overflow-hidden border border-grayScale-200 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">STEP 2: Input &amp; answer types</h2>
          <p className="text-grayScale-500 font-medium mt-1">
            Choose what learners see in the question and how they respond. Add or remove slots for each type
            as needed.
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-10">
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
                      Choose how the question is presented to the learner. Use Add slot / Remove slot to adjust
                      how many fields of each type you need.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {stimulusCatalogKinds.map((kind) => {
                      const { label, Icon } = getStimulusKindPresentation(kind)
                      const selected = draft.stimulus_component_kinds.includes(kind)
                      const slotCount = draft.stimulus_schema.filter((r) => r.kind === kind).length
                      return (
                        <div key={kind} className="space-y-2">
                          <ComponentKindCard
                            label={label}
                            Icon={Icon}
                            selected={selected}
                            onClick={() => handleStimulusKindClick(kind)}
                          />
                          {selected && !isNoInputComponentKind(kind) ? (
                            <div className="flex items-center justify-between gap-2 px-0.5 min-h-[32px]">
                              <span className="text-[12px] text-grayScale-500 font-medium">
                                {slotCount} slot{slotCount === 1 ? "" : "s"}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 shrink-0 text-[12px] font-bold text-grayScale-600 hover:bg-grayScale-100"
                                  onClick={() => removeStimulusSlot(kind)}
                                  disabled={slotCount === 0}
                                  aria-label={`Remove ${label} slot`}
                                >
                                  <Minus className="h-3.5 w-3.5 mr-1" />
                                  Remove
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 shrink-0 text-[12px] font-bold text-[#9E2891] hover:text-[#8A237E] hover:bg-violet-50"
                                  onClick={() => addStimulusSlot(kind)}
                                  aria-label={`Add ${label} slot`}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
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
                      How should the student answer? Use Add slot / Remove slot to adjust how many answer fields
                      each type needs.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {responseCatalogKinds.map((kind) => {
                      const { label, Icon } = getResponseKindPresentation(kind)
                      const selected = draft.response_component_kinds.includes(kind)
                      const slotCount = draft.response_schema.filter((r) => r.kind === kind).length
                      return (
                        <div key={kind} className="space-y-2">
                          <ComponentKindCard
                            label={label}
                            Icon={Icon}
                            selected={selected}
                            onClick={() => handleResponseKindClick(kind)}
                          />
                          {selected && !isNoInputComponentKind(kind) ? (
                            <div className="flex items-center justify-between gap-2 px-0.5 min-h-[32px]">
                              <span className="text-[12px] text-grayScale-500 font-medium">
                                {slotCount} slot{slotCount === 1 ? "" : "s"}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 shrink-0 text-[12px] font-bold text-grayScale-600 hover:bg-grayScale-100"
                                  onClick={() => removeResponseSlot(kind)}
                                  disabled={slotCount === 0}
                                  aria-label={`Remove ${label} slot`}
                                >
                                  <Minus className="h-3.5 w-3.5 mr-1" />
                                  Remove
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 shrink-0 text-[12px] font-bold text-[#9E2891] hover:text-[#8A237E] hover:bg-violet-50"
                                  onClick={() => addResponseSlot(kind)}
                                  aria-label={`Add ${label} slot`}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                  {errors.response_kinds ? (
                    <p className="text-sm font-medium text-red-600">{errors.response_kinds}</p>
                  ) : null}
                </section>
              </div>
            )}

            <SchemaSlotLabelsPanel
              stimulusRows={draft.stimulus_schema}
              responseRows={draft.response_schema}
              onStimulusChange={setStimulusSchema}
              onResponseChange={setResponseSchema}
              errors={errors}
            />

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
                    onChange={setStimulusSchema}
                    error={errors.stimulus_schema}
                    rowErrors={rowErrorMap("stimulus", errors)}
                  />
                  <SchemaBuilderSection
                    title="Response schema"
                    side="response"
                    allowedKinds={draft.response_component_kinds}
                    catalogKinds={responseCatalogKinds}
                    rows={draft.response_schema}
                    onChange={setResponseSchema}
                    error={errors.response_schema}
                    rowErrors={rowErrorMap("response", errors)}
                  />
                </div>
              ) : null}
            </div>
        </div>

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
