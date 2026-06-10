import type { PracticePublishStatus } from "../types/course.types"

export function normalizePublishStatus(
  raw?: string | null,
): PracticePublishStatus | null {
  if (raw === "DRAFT" || raw === "PUBLISHED") return raw
  if (typeof raw === "string") {
    const upper = raw.trim().toUpperCase()
    if (upper === "DRAFT" || upper === "PUBLISHED") {
      return upper as PracticePublishStatus
    }
  }
  return null
}

export function isPublishedPublishStatus(raw?: string | null): boolean {
  return normalizePublishStatus(raw) === "PUBLISHED"
}

export function publishStatusLabel(raw?: string | null): string {
  return normalizePublishStatus(raw) ?? "DRAFT"
}

export function nextPublishStatus(
  current?: string | null,
): PracticePublishStatus {
  return isPublishedPublishStatus(current) ? "DRAFT" : "PUBLISHED"
}
