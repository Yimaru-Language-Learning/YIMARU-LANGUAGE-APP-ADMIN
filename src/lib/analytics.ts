import type { DashboardDateFilter, DateRevenue, LabelCount } from "../types/analytics.types"

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

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
  return `${lmsLessonsWithVideo.toLocaleString()} LMS · ${examPrepLessonsWithVideo.toLocaleString()} exam prep lessons`
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
    const parsed = new Date(date)
    if (parsed.getUTCFullYear() !== year) continue
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
