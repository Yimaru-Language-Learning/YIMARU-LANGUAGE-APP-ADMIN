import type { DashboardData } from "../types/analytics.types"
import { getPrimaryQuestionTypeSummary, getSubscriptionMetrics } from "./analytics"

export type AnalyticsView = "dashboard" | "analytics" | "revenue"

// Only metric values participate: generation times, filters, chart points and
// breakdown ordering must not turn an unchanged poll into an update banner.
export function getAnalyticsKpiSignature(data: DashboardData, view: AnalyticsView): string {
  if (view === "revenue") {
    return JSON.stringify(data.payments.total_revenue)
  }
  const subscriptions = getSubscriptionMetrics(data.subscriptions)
  if (view === "dashboard") {
    return JSON.stringify([
      data.users.total_users, data.users.new_today, data.users.new_week, data.users.new_month,
      data.payments.total_payments, data.payments.successful_payments, data.payments.total_revenue,
      subscriptions.total, subscriptions.active, subscriptions.inactive,
      data.subscriptions.new_today, data.subscriptions.new_week, data.subscriptions.new_month,
      data.subscriptions.renewal?.renewal_rate ?? 0,
      data.subscriptions.snapshot?.auto_renew_enabled ?? 0,
      data.subscriptions.snapshot?.cancelled_now ?? 0,
      data.subscriptions.snapshot?.active_now ?? subscriptions.active,
      data.courses.total_videos, data.courses.lms?.lessons_with_video,
      data.courses.exam_prep?.lessons_with_video, data.content.total_questions,
      getPrimaryQuestionTypeSummary(data.content.questions_by_type),
      data.notifications.total_sent, data.notifications.unread_count,
      data.team.total_members, data.team.by_role.length,
    ])
  }

  const metrics: Record<string, number> = {}
  const collect = (value: unknown, path: string) => {
    if (typeof value === "number") {
      metrics[path] = value
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const key of Object.keys(value).sort()) {
        collect((value as Record<string, unknown>)[key], `${path}.${key}`)
      }
    }
  }
  for (const section of ["users", "subscriptions", "payments", "courses", "content", "notifications", "team", "videos"] as const) {
    collect(data[section], section)
  }
  return JSON.stringify({
    metrics,
    inactiveSubscriptions: subscriptions.inactive,
    questionSummary: getPrimaryQuestionTypeSummary(data.content.questions_by_type),
  })
}
