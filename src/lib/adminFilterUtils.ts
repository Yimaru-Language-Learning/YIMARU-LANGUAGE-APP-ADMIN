type FilterEntry = {
  value: unknown
  defaultValue?: unknown
}

function isActiveFilterValue(value: unknown, defaultValue: unknown): boolean {
  if (value === defaultValue) return false
  if (value == null) return false
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return false
    if (trimmed === "all" || trimmed === "All") return false
  }
  return true
}

/** Count how many filters differ from their default / empty state. */
export function countActiveFilters(entries: FilterEntry[]): number {
  return entries.filter(({ value, defaultValue = "" }) =>
    isActiveFilterValue(value, defaultValue),
  ).length
}
