export const NOT_ASSIGNED_LABEL = "Not assigned"

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : NOT_ASSIGNED_LABEL
}
