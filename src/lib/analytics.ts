import type {
  DashboardDateFilter,
  DashboardSubscriptions,
  DateRevenue,
  LabelCount,
} from "../types/analytics.types"

/** Canonical subscription row statuses shown in analytics breakdowns. */
export const SUBSCRIPTION_STATUS_BREAKDOWN = [
  "ACTIVE",
  "PENDING",
  "EXPIRED",
  "CANCELLED",
] as const

const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#9E2891",
  PENDING: "#FFD23F",
  EXPIRED: "#F97316",
  CANCELLED: "#EF4444",
}

const INACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "INACTIVE",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "PAUSED",
  "SUSPENDED",
])

export interface SubscriptionMetrics {
  total: number
  active: number
  inactive: number
}

export interface SubscriptionStatusPieSlice {
  name: string
  value: number
  color: string
}

/**
 * Ensures every canonical subscription status appears in the pie/legend,
 * including statuses with a count of 0.
 */
export function buildSubscriptionStatusPie(
  byStatus: LabelCount[] | null | undefined,
  fallbackColors: string[] = ["#9E2891", "#FFD23F", "#1DE9B6", "#C26FC0"],
): SubscriptionStatusPieSlice[] {
  const counts = new Map<string, number>()
  for (const row of byStatus ?? []) {
    const key = row.label.trim().toUpperCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + row.count)
  }

  const known = new Set<string>(SUBSCRIPTION_STATUS_BREAKDOWN)
  const slices: SubscriptionStatusPieSlice[] = SUBSCRIPTION_STATUS_BREAKDOWN.map(
    (status, index) => ({
      name: status,
      value: counts.get(status) ?? 0,
      color:
        SUBSCRIPTION_STATUS_COLORS[status] ??
        fallbackColors[index % fallbackColors.length],
    }),
  )

  // Preserve any unexpected statuses from the API after the canonical set.
  for (const [status, value] of counts) {
    if (known.has(status)) continue
    slices.push({
      name: status,
      value,
      color: fallbackColors[slices.length % fallbackColors.length],
    })
  }

  return slices
}

/** Derives inactive count from by_status when present, else total − active. */
export function getSubscriptionMetrics(
  subscriptions: DashboardSubscriptions,
): SubscriptionMetrics {
  const total = subscriptions.total_subscriptions ?? 0
  const active = subscriptions.active_subscriptions ?? 0

  let inactiveFromStatus = 0
  if (subscriptions.by_status?.length) {
    inactiveFromStatus = subscriptions.by_status
      .filter((s) => INACTIVE_SUBSCRIPTION_STATUSES.has(s.label.toUpperCase()))
      .reduce((sum, s) => sum + s.count, 0)

    if (inactiveFromStatus === 0) {
      inactiveFromStatus = subscriptions.by_status
        .filter((s) => s.label.toUpperCase() !== "ACTIVE")
        .reduce((sum, s) => sum + s.count, 0)
    }
  }

  const inactive =
    inactiveFromStatus > 0 ? inactiveFromStatus : Math.max(0, total - active)

  return { total, active, inactive }
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

/** Calendar Y-M-D from an analytics series date (API encodes civil days as UTC midnight). */
export function analyticsSeriesYmd(dateStr: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(dateStr ?? "").trim())
  return match ? match[1] : null
}

/**
 * Format a daily analytics series date for charts.
 * Uses the civil YYYY-MM-DD from the API — never the browser local timezone —
 * so EAT buckets stay aligned with payments/Chapa.
 */
export function formatAnalyticsSeriesDate(dateStr: string): string {
  const ymd = analyticsSeriesYmd(dateStr)
  if (ymd) {
    const [year, month, day] = ymd.split("-").map(Number)
    const d = new Date(Date.UTC(year, month - 1, day))
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
  }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatShortDate(iso: string) {
  const ymd = analyticsSeriesYmd(iso)
  if (ymd) {
    const [year, month, day] = ymd.split("-").map(Number)
    const d = new Date(Date.UTC(year, month - 1, day))
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  }
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatBreakdownLabel(label: string) {
  return label.replace(/_/g, " ").toLowerCase()
}

export function getPrimaryQuestionTypeSummary(questionsByType: LabelCount[]): string {
  if (questionsByType.length === 0) return "No question types"
  const top = [...questionsByType].sort((a, b) => b.count - a.count)[0]
  return `${top.count.toLocaleString()} ${formatBreakdownLabel(top.label)}`
}

export function getVideoLessonsSummary(lmsLessonsWithVideo = 0, examPrepLessonsWithVideo = 0): string {
  return `${lmsLessonsWithVideo.toLocaleString()} LMS · ${examPrepLessonsWithVideo.toLocaleString()} Duolingo/IELTS lessons`
}

export interface MonthlyRevenuePoint {
  month: string
  monthIndex: number
  revenue: number
}

export function aggregateRevenueByMonth(daily: DateRevenue[], year: number): MonthlyRevenuePoint[] {
  const monthly = Array.from({ length: 12 }, (_, monthIndex) => ({
    month: MONTH_SHORT[monthIndex],
    monthIndex,
    revenue: 0,
  }))

  for (const { date, revenue } of daily) {
    const ymd = analyticsSeriesYmd(date)
    const parsed = ymd
      ? (() => {
          const [year, month, day] = ymd.split("-").map(Number)
          return new Date(Date.UTC(year, month - 1, day))
        })()
      : new Date(date)
    if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== year) continue
    monthly[parsed.getUTCMonth()].revenue += revenue
  }

  return monthly
}

export function formatRevenueAxisTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function getSeriesPeriodLabel(dateFilter?: DashboardDateFilter): string {
  if (!dateFilter) return "Last 30 Days"

  switch (dateFilter.mode) {
    case "all_time":
      return "Last 30 Days"
    case "year":
      return dateFilter.year != null ? String(dateFilter.year) : "Selected year"
    case "year_month":
      if (dateFilter.year != null && dateFilter.month != null) {
        return `${MONTH_SHORT[dateFilter.month - 1]} ${dateFilter.year}`
      }
      return "Selected month"
    case "custom":
      if (dateFilter.from && dateFilter.to) {
        return `${formatShortDate(dateFilter.from)} – ${formatShortDate(dateFilter.to)}`
      }
      return "Custom range"
    default:
      return "Selected period"
  }
}

export function formatPercentRate(rate: number, fractionDigits = 1): string {
  if (!Number.isFinite(rate)) return "0%"
  return `${(rate * 100).toFixed(fractionDigits)}%`
}

/** Display label for dashboard breakdown rows (regions, enums, free text). */
export function formatAnalyticsLabel(label: string): string {
  const text = label?.trim() ?? ""
  if (!text || text.toLowerCase() === "unknown" || text.toUpperCase() === "OTHER") {
    return "Other"
  }
  if (text.includes("_")) return text.replace(/_/g, " ")
  return text
}
