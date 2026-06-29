import { Plus, Trash2 } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import type { PracticeParent, PracticeParentKind } from "../../../../types/course.types"
import { dedupeParents, newParentRow } from "../../../../lib/practiceParents"

const LMS_KIND_OPTIONS: { value: PracticeParentKind; label: string }[] = [
  { value: "COURSE", label: "Course" },
  { value: "MODULE", label: "Module" },
  { value: "LESSON", label: "Lesson" },
]

const EXAM_PREP_KIND_OPTIONS: { value: PracticeParentKind; label: string }[] = [
  { value: "CATALOG_COURSE", label: "Catalog course" },
  { value: "UNIT", label: "Unit" },
  { value: "LESSON", label: "Lesson" },
]

interface PracticeParentsFieldProps {
  parents: PracticeParent[]
  onChange: (parents: PracticeParent[]) => void
  disabled?: boolean
  /** When set, this row cannot be removed (contextual entry point). */
  lockedParentKey?: string | null
  /** When true, all rows can be cleared (unlinked practice). */
  optional?: boolean
  /** Use exam-prep parent kinds instead of Learn English. */
  isExamPrep?: boolean
}

function parentKey(parent: PracticeParent): string {
  return `${parent.parent_kind}:${parent.parent_id}`
}

export function PracticeParentsField({
  parents,
  onChange,
  disabled = false,
  lockedParentKey = null,
  optional = false,
  isExamPrep = false,
}: PracticeParentsFieldProps) {
  const kindOptions = isExamPrep ? EXAM_PREP_KIND_OPTIONS : LMS_KIND_OPTIONS
  const rows = parents.length > 0 ? parents : [newParentRow(isExamPrep ? "CATALOG_COURSE" : "LESSON")]

  const updateRow = (index: number, patch: Partial<PracticeParent>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(dedupeParents(next))
  }

  const removeRow = (index: number) => {
    const row = rows[index]
    if (lockedParentKey && parentKey(row) === lockedParentKey) return
    if (rows.length <= 1) {
      if (optional) onChange([])
      return
    }
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...rows, newParentRow()])
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-grayScale-800">Attached locations</p>
        <p className="text-xs text-grayScale-500">
          {optional
            ? isExamPrep
              ? "Attach now or leave empty and link this practice to catalog courses, units, or lessons later."
              : "Attach now or leave empty and link this practice later."
            : isExamPrep
              ? "Link this practice to one or more catalog courses, units, or lessons."
              : "Link this practice to one or more courses, modules, or lessons. Each location can only have one practice."}
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => {
          const key = parentKey(row)
          const isLocked = Boolean(lockedParentKey && key === lockedParentKey && row.parent_id > 0)
          return (
            <li
              key={`${index}-${row.parent_kind}`}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-grayScale-200 bg-grayScale-50/50 px-3 py-2.5"
            >
              <select
                value={row.parent_kind}
                disabled={disabled || isLocked}
                onChange={(e) =>
                  updateRow(index, { parent_kind: e.target.value as PracticeParentKind })
                }
                className="h-9 rounded-[8px] border border-grayScale-200 bg-white px-2.5 text-sm font-medium text-grayScale-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {kindOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                disabled={disabled || isLocked}
                value={row.parent_id > 0 ? row.parent_id : ""}
                onChange={(e) =>
                  updateRow(index, { parent_id: Number(e.target.value) || 0 })
                }
                placeholder="Parent id"
                className="h-9 w-28 rounded-[8px] border-grayScale-200 font-mono text-sm"
              />
              <span className="text-xs text-grayScale-400 hidden sm:inline">
                {row.parent_kind} parent id from the content hierarchy
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-8 w-8 p-0 text-grayScale-400 hover:text-red-600"
                disabled={disabled || rows.length <= 1 || isLocked}
                onClick={() => removeRow(index)}
                aria-label="Remove location"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={addRow}
        className="rounded-[8px] border-grayScale-200 text-xs font-semibold"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add location
      </Button>
    </div>
  )
}
