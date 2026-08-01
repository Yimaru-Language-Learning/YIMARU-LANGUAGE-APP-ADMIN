export const UNASSIGNED_LABEL = "unassigned"

/** @deprecated Prefer UNASSIGNED_LABEL */
export const NOT_ASSIGNED_LABEL = UNASSIGNED_LABEL

const LEGACY_EMPTY_LABELS = new Set(["—", "-", "Not assigned", "not assigned"])

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed || LEGACY_EMPTY_LABELS.has(trimmed) || trimmed === UNASSIGNED_LABEL) {
    return UNASSIGNED_LABEL
  }
  return trimmed
}

export function isUnassignedLabel(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  return !trimmed || trimmed === UNASSIGNED_LABEL || LEGACY_EMPTY_LABELS.has(trimmed)
}
