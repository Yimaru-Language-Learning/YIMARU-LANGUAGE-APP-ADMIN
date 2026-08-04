import type { ActivityLog, ActivityLogActorKind } from "../types/activity-log.types"
import {
  formatAppDate,
  formatAppTime,
  toAppDayEndISO,
  toAppDayStartISO,
} from "./datetime"

export type ActorDisplay = {
  name: string
  role?: string
  kind?: ActivityLogActorKind
  email?: string
}

export type ActivityLogActorFields = Pick<
  ActivityLog,
  "actor_id" | "actor_role" | "actor_name" | "actor_email" | "actor_kind"
>

export type ActionBadgeTone = "auth" | "content" | "user" | "billing" | "team" | "default"

const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: "Signed in",
  AUTH_LOGOUT: "Signed out",
  AUTH_REGISTER: "Registered",
  AUTH_TOKEN_REFRESHED: "Token refreshed",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_DELETED: "User deleted",
  USER_PASSWORD_RESET: "Password reset",
  USER_PROFILE_PICTURE_UPDATED: "Profile picture updated",
  USERS_PURGED: "Users purged",
  ADMIN_CREATED: "Admin created",
  ADMIN_UPDATED: "Admin updated",
  TEAM_MEMBER_CREATED: "Team member created",
  TEAM_MEMBER_INVITED: "Team member invited",
  TEAM_MEMBER_UPDATED: "Team member updated",
  TEAM_MEMBER_DELETED: "Team member deleted",
  TEAM_MEMBER_PASSWORD_CHANGED: "Team password changed",
  TEAM_INVITATION_RESENT: "Invitation resent",
  TEAM_INVITATION_REVOKED: "Invitation revoked",
  FAQ_CREATED: "FAQ created",
  FAQ_UPDATED: "FAQ updated",
  FAQ_DELETED: "FAQ deleted",
  PERSONA_CREATED: "Persona created",
  PERSONA_UPDATED: "Persona updated",
  PERSONA_DELETED: "Persona deleted",
  QUESTION_TYPE_DEFINITION_CREATED: "Question type created",
  QUESTION_TYPE_DEFINITION_UPDATED: "Question type updated",
  QUESTION_TYPE_DEFINITION_DELETED: "Question type deleted",
  QUESTION_TYPE_DEFINITION_GROUP_CREATED: "Question type group created",
  QUESTION_TYPE_DEFINITION_GROUP_UPDATED: "Question type group updated",
  QUESTION_TYPE_DEFINITION_GROUP_DELETED: "Question type group deleted",
  PAYMENT_INITIATED: "Payment initiated",
  PAYMENT_VERIFIED: "Payment verified",
  PAYMENT_CANCELLED: "Payment cancelled",
  PAYMENT_WEBHOOK_RECEIVED: "Payment webhook received",
  SUBSCRIPTION_CREATED: "Subscription created",
  SUBSCRIPTION_EXTENDED: "Subscription extended",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled",
  NOTIFICATION_BULK_SENT: "Bulk notification sent",
  NOTIFICATION_CREATED: "Notification created",
  NOTIFICATION_UPDATED: "Notification updated",
  NOTIFICATION_DELETED: "Notification deleted",
  PRACTICE_COMPLETED: "Practice completed",
  LESSON_COMPLETED: "Lesson completed",
  SETTINGS_UPDATED: "Settings updated",
}

const ACTION_CATEGORY: Record<string, ActionBadgeTone> = {
  AUTH_LOGIN: "auth",
  AUTH_LOGOUT: "auth",
  AUTH_REGISTER: "auth",
  AUTH_TOKEN_REFRESHED: "auth",
  USER_CREATED: "user",
  USER_UPDATED: "user",
  USER_DELETED: "user",
  USER_PASSWORD_RESET: "user",
  USERS_PURGED: "user",
  ADMIN_CREATED: "user",
  ADMIN_UPDATED: "user",
  TEAM_MEMBER_CREATED: "team",
  TEAM_MEMBER_UPDATED: "team",
  TEAM_MEMBER_DELETED: "team",
  TEAM_MEMBER_INVITED: "team",
  PAYMENT_INITIATED: "billing",
  PAYMENT_VERIFIED: "billing",
  PAYMENT_CANCELLED: "billing",
  PAYMENT_WEBHOOK_RECEIVED: "billing",
  SUBSCRIPTION_CREATED: "billing",
  SUBSCRIPTION_EXTENDED: "billing",
  SUBSCRIPTION_CANCELLED: "billing",
}

export const ACTION_FILTER_GROUPS: { label: string; actions: string[] }[] = [
  {
    label: "Authentication",
    actions: ["AUTH_LOGIN", "AUTH_LOGOUT", "AUTH_REGISTER", "AUTH_TOKEN_REFRESHED"],
  },
  {
    label: "Users & admins",
    actions: [
      "USER_CREATED",
      "USER_UPDATED",
      "USER_DELETED",
      "USER_PASSWORD_RESET",
      "ADMIN_CREATED",
      "ADMIN_UPDATED",
    ],
  },
  {
    label: "Team",
    actions: [
      "TEAM_MEMBER_CREATED",
      "TEAM_MEMBER_INVITED",
      "TEAM_MEMBER_UPDATED",
      "TEAM_MEMBER_DELETED",
      "TEAM_MEMBER_PASSWORD_CHANGED",
      "TEAM_INVITATION_RESENT",
      "TEAM_INVITATION_REVOKED",
    ],
  },
  {
    label: "LMS content",
    actions: [
      "PROGRAM_CREATED",
      "PROGRAM_UPDATED",
      "PROGRAM_DELETED",
      "COURSE_CREATED",
      "COURSE_UPDATED",
      "COURSE_DELETED",
      "MODULE_CREATED",
      "MODULE_UPDATED",
      "MODULE_DELETED",
      "LESSON_CREATED",
      "LESSON_UPDATED",
      "LESSON_DELETED",
      "PRACTICE_CREATED",
      "PRACTICE_UPDATED",
      "PRACTICE_DELETED",
    ],
  },
  {
    label: "Questions",
    actions: [
      "QUESTION_CREATED",
      "QUESTION_UPDATED",
      "QUESTION_DELETED",
      "QUESTION_TYPE_DEFINITION_CREATED",
      "QUESTION_TYPE_DEFINITION_UPDATED",
      "QUESTION_TYPE_DEFINITION_DELETED",
      "QUESTION_TYPE_DEFINITION_GROUP_CREATED",
      "QUESTION_TYPE_DEFINITION_GROUP_UPDATED",
      "QUESTION_TYPE_DEFINITION_GROUP_DELETED",
    ],
  },
  {
    label: "CMS & personas",
    actions: [
      "FAQ_CREATED",
      "FAQ_UPDATED",
      "FAQ_DELETED",
      "PERSONA_CREATED",
      "PERSONA_UPDATED",
      "PERSONA_DELETED",
      "EMAIL_TEMPLATE_CREATED",
      "EMAIL_TEMPLATE_UPDATED",
      "EMAIL_TEMPLATE_DELETED",
      "SETTINGS_UPDATED",
    ],
  },
  {
    label: "Billing",
    actions: [
      "SUBSCRIPTION_PLAN_CREATED",
      "SUBSCRIPTION_PLAN_UPDATED",
      "SUBSCRIPTION_CREATED",
      "SUBSCRIPTION_EXTENDED",
      "SUBSCRIPTION_CANCELLED",
      "PAYMENT_INITIATED",
      "PAYMENT_VERIFIED",
      "PAYMENT_CANCELLED",
      "PAYMENT_WEBHOOK_RECEIVED",
    ],
  },
  {
    label: "Notifications",
    actions: [
      "NOTIFICATION_CREATED",
      "NOTIFICATION_UPDATED",
      "NOTIFICATION_DELETED",
      "NOTIFICATION_BULK_SENT",
      "SCHEDULED_NOTIFICATION_CANCELLED",
    ],
  },
  {
    label: "Learner progress",
    actions: ["LESSON_COMPLETED", "PRACTICE_COMPLETED", "RATING_SUBMITTED", "RATING_DELETED"],
  },
]

export const RESOURCE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "AUTH", label: "Authentication" },
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "TEAM_MEMBER", label: "Team member" },
  { value: "PROGRAM", label: "Program" },
  { value: "COURSE", label: "Course" },
  { value: "MODULE", label: "Module" },
  { value: "LESSON", label: "Lesson" },
  { value: "PRACTICE", label: "Practice" },
  { value: "QUESTION", label: "Question" },
  { value: "QUESTION_TYPE_DEFINITION", label: "Question type" },
  { value: "QUESTION_TYPE_DEFINITION_GROUP", label: "Question type group" },
  { value: "FAQ", label: "FAQ" },
  { value: "PERSONA", label: "Persona" },
  { value: "PAYMENT", label: "Payment" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "SUBSCRIPTION_PLAN", label: "Subscription plan" },
  { value: "NOTIFICATION", label: "Notification" },
  { value: "EMAIL_TEMPLATE", label: "Email template" },
  { value: "SETTINGS", label: "Settings" },
  { value: "VIDEO", label: "Video" },
  { value: "CATEGORY", label: "Category" },
  { value: "SUB_COURSE", label: "Sub-course" },
  { value: "QUESTION_SET", label: "Question set" },
  { value: "EXAM_PREP_CATALOG_COURSE", label: "Exam prep course" },
  { value: "EXAM_PREP_UNIT", label: "Exam prep unit" },
  { value: "EXAM_PREP_MODULE", label: "Exam prep module" },
  { value: "EXAM_PREP_LESSON", label: "Exam prep lesson" },
  { value: "EXAM_PREP_PRACTICE", label: "Exam prep practice" },
  { value: "APP_VERSION", label: "App version" },
  { value: "FIELD_OPTION", label: "Field option" },
  { value: "DEVICE", label: "Device" },
  { value: "FILE", label: "File" },
  { value: "REFERRAL", label: "Referral" },
  { value: "ASSESSMENT_QUESTION", label: "Assessment question" },
  { value: "RATING", label: "Rating" },
]

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function actionBadgeTone(action: string): ActionBadgeTone {
  if (ACTION_CATEGORY[action]) return ACTION_CATEGORY[action]
  if (action.startsWith("TEAM_")) return "team"
  if (action.startsWith("AUTH_")) return "auth"
  if (action.includes("PAYMENT") || action.includes("SUBSCRIPTION")) return "billing"
  if (action.startsWith("USER_") || action.startsWith("ADMIN_")) return "user"
  if (
    action.includes("CREATED") ||
    action.includes("UPDATED") ||
    action.includes("DELETED") ||
    action.includes("COMPLETED")
  ) {
    return "content"
  }
  return "default"
}

export function actionBadgeClasses(action: string): string {
  const tone = actionBadgeTone(action)
  switch (tone) {
    case "auth":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "content":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "user":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "billing":
      return "bg-violet-50 text-violet-700 border-violet-200"
    case "team":
      return "bg-blue-50 text-blue-700 border-blue-200"
    default:
      return "bg-grayScale-100 text-grayScale-600 border-grayScale-200"
  }
}

export function resourceTypeLabel(resourceType: string): string {
  const match = RESOURCE_TYPE_OPTIONS.find((o) => o.value === resourceType)
  return match?.label ?? resourceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatActorDisplay(log: ActivityLogActorFields): ActorDisplay {
  if (log.actor_name?.trim()) {
    return {
      name: log.actor_name.trim(),
      role: log.actor_role ?? undefined,
      kind: log.actor_kind ?? undefined,
      email: log.actor_email ?? undefined,
    }
  }
  if (log.actor_email?.trim()) {
    return {
      name: log.actor_email.trim(),
      role: log.actor_role ?? undefined,
      kind: log.actor_kind ?? undefined,
      email: log.actor_email.trim(),
    }
  }
  if (log.actor_id != null) {
    return { name: `#${log.actor_id}`, role: log.actor_role ?? undefined }
  }
  return { name: "System" }
}

export function formatActorFallback(log: ActivityLogActorFields): string {
  const { name, role } = formatActorDisplay(log)
  if (name === "System") return name
  if (name.startsWith("#") && role) return `${name} (${role})`
  return name
}

export function activityLogActorPath(log: ActivityLogActorFields): string | null {
  if (log.actor_id == null) return null
  if (log.actor_kind === "team_member") return `/team/${log.actor_id}`
  if (log.actor_kind === "user") return `/users/${log.actor_id}`
  const role = log.actor_role?.trim().toUpperCase()
  if (role === "INSTRUCTOR" || role === "SUPPORT" || role === "CONTENT_MANAGER") {
    return `/team/${log.actor_id}`
  }
  return `/users/${log.actor_id}`
}

/** Admin routes for deep linking from activity log rows. */
export function activityLogResourcePath(
  resourceType: string,
  resourceId: number | null | undefined,
): string | null {
  if (resourceId == null || resourceId <= 0) return null
  switch (resourceType) {
    case "USER":
    case "ADMIN":
      return `/users/${resourceId}`
    case "TEAM_MEMBER":
      return `/team/${resourceId}`
    case "FAQ":
      return `/help/faqs/${resourceId}/edit`
    case "PERSONA":
      return `/personas`
    case "QUESTION_TYPE_DEFINITION":
      return `/new-content/question-types/${resourceId}/edit`
    case "QUESTION_TYPE_DEFINITION_GROUP":
      return `/new-content/question-types/groups/${resourceId}`
    case "PAYMENT":
      return `/payments`
    case "NOTIFICATION":
      return `/notifications`
    case "EMAIL_TEMPLATE":
      return `/notifications/email-templates`
    case "SUBSCRIPTION_PLAN":
      return `/settings`
    default:
      return null
  }
}

export function formatActivityDate(dateStr: string): string {
  return formatAppDate(dateStr, "—")
}

export function formatActivityTime(dateStr: string): string {
  return formatAppTime(dateStr, "—")
}

export function getRelativeActivityTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatActivityDate(dateStr)
}

export function toRfc3339StartOfDay(dateValue: string): string {
  return toAppDayStartISO(dateValue)
}

export function toRfc3339EndOfDay(dateValue: string): string {
  return toAppDayEndISO(dateValue)
}
