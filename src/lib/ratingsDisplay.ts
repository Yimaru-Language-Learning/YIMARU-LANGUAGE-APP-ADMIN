import type { RatingTargetType } from "../types/ratings.types"
import { formatAppDate, formatAppDateTime } from "./datetime"

export function formatAverageStars(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0.0"
  return value.toFixed(1)
}

export function formatRatingDate(dateStr: string): string {
  return formatAppDate(dateStr, dateStr || "unassigned")
}

export function formatRatingDateTime(dateStr: string): string {
  return formatAppDateTime(dateStr, dateStr || "unassigned")
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
