import type { RatingTargetType } from "../types/ratings.types"

export function formatAverageStars(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0.0"
  return value.toFixed(1)
}

export function formatRatingDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr || "—"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatRatingDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr || "—"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function targetTypeLabel(type: RatingTargetType): string {
  switch (type) {
    case "app":
      return "App"
    case "course":
      return "Course"
    case "sub_course":
      return "Sub-course"
    default:
      return type
  }
}

export function reviewTextOrPlaceholder(review: string | null | undefined): string {
  const text = review?.trim()
  return text ? text : "No written review"
}

export function userDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  userId?: number,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  if (name) return name
  if (userId != null) return `User #${userId}`
  return "Unknown user"
}
