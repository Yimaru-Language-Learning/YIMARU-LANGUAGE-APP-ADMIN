import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  UserPlus,
  CreditCard,
  BookOpen,
  Video,
  ShieldAlert,
} from "lucide-react"
import { formatAppDate, formatAppDateTime } from "./datetime"

export const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  announcement: { icon: Megaphone, color: "text-brand-600", bg: "bg-brand-100" },
  system_alert: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
  issue_created: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  issue_status_updated: { icon: CheckCircle2, color: "text-sky-600", bg: "bg-sky-50" },
  course_created: { icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
  course_enrolled: { icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50" },
  sub_course_created: { icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
  video_added: { icon: Video, color: "text-pink-600", bg: "bg-pink-50" },
  user_deleted: { icon: UserPlus, color: "text-red-600", bg: "bg-red-50" },
  admin_created: { icon: UserPlus, color: "text-brand-600", bg: "bg-brand-100" },
  team_member_created: { icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
  subscription_activated: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  payment_verified: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  knowledge_level_update: { icon: Info, color: "text-sky-600", bg: "bg-sky-50" },
  assessment_assigned: { icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
}

export const DEFAULT_NOTIFICATION_TYPE_CONFIG = {
  icon: Bell,
  color: "text-grayScale-500",
  bg: "bg-grayScale-100",
}

export function getNotificationLevelBadge(level: string) {
  switch (level) {
    case "error":
    case "critical":
      return "destructive" as const
    case "warning":
      return "warning" as const
    case "success":
      return "success" as const
    case "info":
    default:
      return "info" as const
  }
}

export function formatNotificationTimestamp(ts: string) {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return "unassigned"
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return formatAppDate(ts)
}

export function formatNotificationTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function formatNotificationDateTime(ts: string) {
  return formatAppDateTime(ts, "unassigned")
}

export function isMeaningfulExpiry(expires: string) {
  if (!expires) return false
  const date = new Date(expires)
  if (Number.isNaN(date.getTime())) return false
  return date.getFullYear() > 1
}
