import type { ReactNode } from "react"
import { cn } from "./utils"

export const UNASSIGNED_LABEL = "unassigned"

/** @deprecated Prefer UNASSIGNED_LABEL */
export const NOT_ASSIGNED_LABEL = UNASSIGNED_LABEL

const LEGACY_EMPTY_LABELS = new Set(["—", "-", "Not assigned", "not assigned"])

export function isUnassignedLabel(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  return !trimmed || trimmed === UNASSIGNED_LABEL || LEGACY_EMPTY_LABELS.has(trimmed)
}

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed || LEGACY_EMPTY_LABELS.has(trimmed) || trimmed === UNASSIGNED_LABEL) {
    return UNASSIGNED_LABEL
  }
  return trimmed
}

export function UnassignedLabel({ className }: { className?: string }) {
  return (
    <span className={cn("italic text-grayScale-400", className)}>{UNASSIGNED_LABEL}</span>
  )
}

/** Renders a value, or an italic "unassigned" label when empty/missing. */
export function DisplayValue({
  value,
  className,
  unassignedClassName,
}: {
  value: string | number | null | undefined
  className?: string
  unassignedClassName?: string
}): ReactNode {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return <UnassignedLabel className={unassignedClassName} />
    }
    return <span className={className}>{value}</span>
  }
  if (isUnassignedLabel(value)) {
    return <UnassignedLabel className={unassignedClassName} />
  }
  return <span className={className}>{value!.trim()}</span>
}
