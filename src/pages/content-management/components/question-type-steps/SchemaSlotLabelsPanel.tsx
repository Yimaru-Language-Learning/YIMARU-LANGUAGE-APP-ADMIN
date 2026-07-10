import { Trash2 } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import type { DynamicElementDefinition } from "../../../../types/questionTypeDefinition.types"
import {
  defaultLabelForKind,
  getResponseKindPresentation,
  getStimulusKindPresentation,
} from "./componentKindUi"
import { isNoInputComponentKind } from "../../../../lib/questionComponentKinds"

interface SchemaSlotLabelsPanelProps {
  stimulusRows: DynamicElementDefinition[]
  responseRows: DynamicElementDefinition[]
  onStimulusChange: (rows: DynamicElementDefinition[]) => void
  onResponseChange: (rows: DynamicElementDefinition[]) => void
  errors?: Record<string, string>
}

function updateRowLabel(
  rows: DynamicElementDefinition[],
  index: number,
  label: string,
): DynamicElementDefinition[] {
  return rows.map((row, i) => (i === index ? { ...row, label } : row))
}

function removeRow(rows: DynamicElementDefinition[], index: number): DynamicElementDefinition[] {
  return rows.filter((_, i) => i !== index)
}

function SlotLabelGroup({
  title,
  side,
  rows,
  onChange,
  errors,
}: {
  title: string
  side: "stimulus" | "response"
  rows: DynamicElementDefinition[]
  onChange: (rows: DynamicElementDefinition[]) => void
  errors?: Record<string, string>
}) {
  if (!rows.length) return null

  return (
    <div className="space-y-3">
      <h4 className="text-[12px] font-bold uppercase tracking-wide text-grayScale-500 dark:text-grayScale-400">{title}</h4>
      <div className="space-y-2">
        {rows.map((row, index) => {
          const presentation =
            side === "stimulus"
              ? getStimulusKindPresentation(row.kind)
              : getResponseKindPresentation(row.kind)
          const rowError = errors?.[`${side}_${index}`]
          return (
            <div
              key={`${side}-${row.id}-${index}`}
              className="rounded-xl border border-grayScale-200 bg-white dark:bg-grayScale-100 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-grayScale-500">
                  <span className="font-semibold text-grayScale-700 dark:text-grayScale-500">{presentation.label}</span>
                  <span className="text-grayScale-300">·</span>
                  <span className="font-mono text-[11px]">{row.id}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-grayScale-500 hover:text-red-600"
                  onClick={() => onChange(removeRow(rows, index))}
                  aria-label={`Remove ${presentation.label} slot`}
                  disabled={isNoInputComponentKind(row.kind)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {isNoInputComponentKind(row.kind) ? (
                  <p className="text-[12px] text-grayScale-500">
                    No author input is collected for this side.
                  </p>
                ) : (
                  <>
                    <label className="text-[12px] font-semibold text-grayScale-600">
                      Field label <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={row.label ?? ""}
                      onChange={(e) => onChange(updateRowLabel(rows, index, e.target.value))}
                      placeholder={defaultLabelForKind(row.kind)}
                      className="h-10 bg-white dark:bg-grayScale-50"
                    />
                    <p className="text-[11px] text-grayScale-400">
                      Shown to authors when they create questions from this type.
                    </p>
                  </>
                )}
              </div>
              {rowError ? <p className="text-sm text-red-600">{rowError}</p> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SchemaSlotLabelsPanel({
  stimulusRows,
  responseRows,
  onStimulusChange,
  onResponseChange,
  errors,
}: SchemaSlotLabelsPanelProps) {
  if (!stimulusRows.length && !responseRows.length) return null

  return (
    <div className="rounded-xl border border-grayScale-200 bg-[#F8FAFC] dark:bg-grayScale-100 p-5 space-y-6">
      <div>
        <h3 className="text-[16px] font-bold text-grayScale-900 dark:text-grayScale-600">Field labels</h3>
        <p className="text-[13px] text-grayScale-500 dark:text-grayScale-400 mt-0.5">
          Name each schema slot for question authors, or remove slots you no longer need. Labels are stored on
          the definition and are not sent inside question payloads.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SlotLabelGroup
          title="Question content (stimulus)"
          side="stimulus"
          rows={stimulusRows}
          onChange={onStimulusChange}
          errors={errors}
        />
        <SlotLabelGroup
          title="Learner answer (response)"
          side="response"
          rows={responseRows}
          onChange={onResponseChange}
          errors={errors}
        />
      </div>
    </div>
  )
}
