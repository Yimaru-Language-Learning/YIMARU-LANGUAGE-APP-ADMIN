import type { QuestionTypeDefinitionGroup } from "../types/questionTypeDefinition.types"

/** Normalize API / draft `group_ids` to sorted unique positive ids, or null when empty. */
export function normalizeGroupIds(value: unknown): number[] | null {
  if (value == null) return null
  if (Array.isArray(value)) {
    const ids = value
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (!ids.length) return null
    return [...new Set(ids)].sort((a, b) => a - b)
  }
  const single = Number(value)
  if (Number.isFinite(single) && single > 0) return [single]
  return null
}

export function isDefinitionUngrouped(groupIds: number[] | null | undefined): boolean {
  return groupIds == null || groupIds.length === 0
}

export function definitionBelongsToGroup(
  groupIds: number[] | null | undefined,
  groupId: number,
): boolean {
  return groupIds?.includes(groupId) ?? false
}

export function removeGroupFromMembership(
  groupIds: number[] | null | undefined,
  groupId: number,
): number[] | null {
  const next = (groupIds ?? []).filter((id) => id !== groupId)
  return next.length ? next : null
}

export function questionTypeGroupLabels(
  groupIds: number[] | null | undefined,
  groups: QuestionTypeDefinitionGroup[],
): string {
  if (isDefinitionUngrouped(groupIds)) return "Ungrouped"
  return (groupIds ?? [])
    .map((id) => groups.find((g) => g.id === id)?.name ?? `Group #${id}`)
    .join(", ")
}
