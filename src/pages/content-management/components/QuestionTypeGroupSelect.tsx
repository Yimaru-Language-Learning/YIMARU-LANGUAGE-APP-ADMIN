import { useEffect, useState } from "react"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { getQuestionTypeDefinitionGroups } from "../../../api/questionTypeDefinitionGroups.api"
import type { QuestionTypeDefinitionGroup } from "../../../types/questionTypeDefinition.types"
import { normalizeGroupIds, questionTypeGroupLabels } from "../../../lib/questionTypeGroupIds"
import { cn } from "../../../lib/utils"

interface QuestionTypeGroupsMultiSelectProps {
  value: number[] | null
  onChange: (groupIds: number[] | null) => void
  disabled?: boolean
  className?: string
  /** When true, only ACTIVE groups are listed */
  activeOnly?: boolean
}

export function QuestionTypeGroupsMultiSelect({
  value,
  onChange,
  disabled,
  className,
  activeOnly = true,
}: QuestionTypeGroupsMultiSelectProps) {
  const [groups, setGroups] = useState<QuestionTypeDefinitionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const selected = new Set(value ?? [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQuestionTypeDefinitionGroups(activeOnly ? { status: "ACTIVE" } : undefined)
      .then((res) => {
        if (!cancelled) setGroups(res.groups)
      })
      .catch(() => {
        if (!cancelled) setGroups([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeOnly])

  const toggle = (groupId: number) => {
    const current = value ?? []
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]
    onChange(normalizeGroupIds(next))
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "max-h-48 space-y-1 overflow-y-auto rounded-[12px] border border-grayScale-300 bg-[#F8FAFC] p-3",
          disabled && "opacity-70",
        )}
      >
        {loading ? (
          <p className="text-sm text-grayScale-500">Loading groups…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-grayScale-500">No groups yet. Create one from the library page.</p>
        ) : (
          groups.map((g) => (
            <label
              key={g.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grayScale-800 hover:bg-white",
                disabled && "cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-grayScale-300 text-brand-600 focus:ring-brand-500"
                checked={selected.has(g.id)}
                disabled={disabled || loading}
                onChange={() => toggle(g.id)}
              />
              <span className="font-medium">{g.name}</span>
            </label>
          ))
        )}
      </div>
      {loading ? (
        <SpinnerIcon className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-grayScale-400" />
      ) : null}
    </div>
  )
}

/** @deprecated Use QuestionTypeGroupsMultiSelect */
export const QuestionTypeGroupSelect = QuestionTypeGroupsMultiSelect

export function questionTypeGroupLabel(
  groupId: number | null | undefined,
  groups: QuestionTypeDefinitionGroup[],
): string {
  if (groupId == null) return "Ungrouped"
  return questionTypeGroupLabels([groupId], groups)
}
