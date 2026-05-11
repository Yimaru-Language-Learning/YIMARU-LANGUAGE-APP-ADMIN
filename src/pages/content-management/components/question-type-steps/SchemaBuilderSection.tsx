import { Plus, Trash2 } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Textarea } from "../../../../components/ui/textarea"
import { Select } from "../../../../components/ui/select"
import type { DynamicElementDefinition } from "../../../../types/questionTypeDefinition.types"

type Side = "stimulus" | "response"

interface SchemaBuilderSectionProps {
  title: string
  side: Side
  allowedKinds: string[]
  catalogKinds: string[]
  rows: DynamicElementDefinition[]
  onChange: (rows: DynamicElementDefinition[]) => void
  error?: string
  rowErrors?: Record<number, string>
}

function emptyRow(allowedKinds: string[]): DynamicElementDefinition {
  const first = allowedKinds[0] ?? ""
  return {
    id: "",
    kind: first,
    label: "",
    required: true,
    config: undefined,
  }
}

export function SchemaBuilderSection({
  title,
  side,
  allowedKinds,
  catalogKinds,
  rows,
  onChange,
  error,
  rowErrors,
}: SchemaBuilderSectionProps) {
  const kindOptions =
    allowedKinds.length > 0 ? allowedKinds : catalogKinds.length > 0 ? catalogKinds : []

  const updateRow = (index: number, patch: Partial<DynamicElementDefinition>) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    onChange(next)
  }

  const commitConfigString = (index: number, raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      updateRow(index, { config: undefined })
      return
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        updateRow(index, { config: parsed })
      }
    } catch {
      /* keep previous config; user can fix JSON */
    }
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-bold text-grayScale-900">{title}</h3>
          <p className="text-[13px] text-grayScale-500 mt-0.5">
            Each row defines one element in the{" "}
            {side === "stimulus" ? "stimulus" : "response"} schema (id, kind, label, required, optional JSON
            config).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onChange([...rows, emptyRow(kindOptions)])}
          disabled={!kindOptions.length}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add row
        </Button>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {!kindOptions.length ? (
        <p className="text-sm text-grayScale-500 rounded-lg border border-dashed border-grayScale-200 p-4">
          Select component kinds in the previous step (or wait for the catalog to load) before building the{" "}
          {side} schema.
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${side}-${index}`}
            className="rounded-xl border border-grayScale-200 bg-[#F8FAFC] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wide text-grayScale-400">
                Row {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-grayScale-500 hover:text-red-600"
                onClick={() => removeRow(index)}
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-grayScale-600">
                  Element id <span className="text-red-500">*</span>
                </label>
                <Input
                  value={row.id}
                  onChange={(e) => updateRow(index, { id: e.target.value })}
                  placeholder="e.g. prompt"
                  className="h-10 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-grayScale-600">
                  Kind <span className="text-red-500">*</span>
                </label>
                <Select
                  className="h-10 bg-white"
                  value={row.kind}
                  onChange={(e) => updateRow(index, { kind: e.target.value })}
                >
                  {kindOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-grayScale-600">Label</label>
                <Input
                  value={row.label ?? ""}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder="Author-facing label"
                  className="h-10 bg-white"
                />
              </div>
              <label className="flex items-center gap-2 pt-6 md:pt-8">
                <input
                  type="checkbox"
                  checked={row.required}
                  onChange={(e) => updateRow(index, { required: e.target.checked })}
                  className="rounded border-grayScale-300"
                />
                <span className="text-[13px] font-medium text-grayScale-700">Required</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-grayScale-600">Config (JSON object)</label>
              <Textarea
                className="min-h-[72px] font-mono text-[13px] bg-white"
                placeholder='{"max_length": 1000}'
                defaultValue={row.config ? JSON.stringify(row.config, null, 2) : ""}
                key={`${side}-cfg-${index}-${rows.length}`}
                onBlur={(e) => commitConfigString(index, e.target.value)}
              />
              <p className="text-[11px] text-grayScale-400">Tab out of the field to apply JSON config.</p>
            </div>

            {rowErrors?.[index] ? <p className="text-sm text-red-600">{rowErrors[index]}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
