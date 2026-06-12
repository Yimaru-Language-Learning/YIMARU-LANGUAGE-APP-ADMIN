import type { UserApiDTO } from "../types/user.types"
import type {
  BulkSendResult,
  PlatformRole,
  ScheduledNotification,
} from "../types/notification.types"
import { getUsers } from "../api/users.api"

export const PLATFORM_ROLES: { value: PlatformRole; label: string }[] = [
  { value: "STUDENT", label: "Students" },
  { value: "OPEN_LEARNER", label: "Open learners" },
  { value: "INSTRUCTOR", label: "Instructors" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUPER_ADMIN", label: "Super admins" },
  { value: "SUPPORT", label: "Support" },
]

export const IN_APP_TYPES = [
  { value: "system_alert", label: "System alert" },
  { value: "subscription_expiring", label: "Subscription expiring" },
  { value: "course_completed", label: "Course completed" },
  { value: "payment_verified", label: "Payment verified" },
] as const

export const IN_APP_LEVELS = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "success", label: "Success" },
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function isScheduledNotification(value: unknown): value is ScheduledNotification {
  if (!isRecord(value)) return false
  return typeof value.id === "number" && typeof value.scheduled_at === "string"
}

export function parseBulkResponseData(data: unknown): BulkSendResult | ScheduledNotification {
  if (isScheduledNotification(data)) return data
  if (!isRecord(data)) {
    return { sent: 0, failed: 0 }
  }
  return {
    total_recipients:
      data.total_recipients != null ? Number(data.total_recipients) : undefined,
    sent: Number(data.sent ?? 0),
    failed: Number(data.failed ?? 0),
    target_users: data.target_users != null ? Number(data.target_users) : undefined,
    image: data.image != null ? String(data.image) : undefined,
  }
}

export function toRfc3339Utc(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
): string | null {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  const h = Number(hour)
  const min = Number(minute)

  const formatOk =
    year.length === 4 &&
    month.length === 2 &&
    day.length === 2 &&
    hour.length === 2 &&
    minute.length === 2
  const dateValue = new Date(y, m - 1, d)
  const dateOk =
    formatOk &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= 31 &&
    dateValue.getFullYear() === y &&
    dateValue.getMonth() === m - 1 &&
    dateValue.getDate() === d
  const timeOk = h >= 0 && h <= 23 && min >= 0 && min <= 59

  if (!dateOk || !timeOk) return null

  const utc = new Date(Date.UTC(y, m - 1, d, h, min, 0, 0))
  if (utc.getTime() <= Date.now()) return null
  return utc.toISOString()
}

export function parseDirectRecipients(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formatScheduledAtLabel(value: string): string {
  if (!value) return "Set date & time"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function scheduledStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "secondary"
    case "processing":
      return "default"
    case "sent":
      return "default"
    case "failed":
      return "destructive"
    case "cancelled":
      return "outline"
    default:
      return "outline"
  }
}

export function channelLabel(channel: string): string {
  switch (channel) {
    case "sms":
      return "SMS"
    case "email":
      return "Email"
    case "push":
      return "Push"
    case "in_app":
      return "In-app"
    default:
      return channel
  }
}

export async function fetchAllPlatformUsers(): Promise<UserApiDTO[]> {
  const pageSize = 50
  const firstRes = await getUsers({ page: 1, page_size: pageSize })
  const firstBatch = firstRes.data?.data?.users ?? []
  const total = firstRes.data?.data?.total ?? firstBatch.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) return firstBatch

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      getUsers({ page: i + 2, page_size: pageSize }),
    ),
  )
  const rest = remaining.flatMap((r) => r.data?.data?.users ?? [])
  return [...firstBatch, ...rest]
}

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (isRecord(err) && isRecord(err.response) && isRecord(err.response.data)) {
    const data = err.response.data
    if (typeof data.message === "string" && data.message) return data.message
    if (typeof data.error === "string" && data.error) return data.error
  }
  return fallback
}
