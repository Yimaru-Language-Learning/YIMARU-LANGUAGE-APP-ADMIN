import { useEffect, useState, type ElementType, type ReactNode } from "react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import alertSrc from "../../assets/Alert.svg"
import {
  Users,
  BadgeCheck,
  DollarSign,
  BookOpen,
  HelpCircle,
  Bell,
  UsersRound,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Video,
  FolderOpen,
  RefreshCw,
  ChevronDown,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  SensitiveChart,
  SensitiveRevealProvider,
  SensitiveValue,
} from "../../components/ui/sensitive-value"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"
import { getDashboard } from "../../api/analytics.api"
import { AnalyticsTimeRangeFilter, getDashboardFilterLabel } from "../../components/analytics/AnalyticsTimeRangeFilter"
import {
  MonthlyRevenueAreaChart,
  MonthlyRevenueTrendPanel,
  SensitiveYtdValue,
  analyticsSoftCardClass,
} from "../../components/analytics/SubscriptionRevenueVisuals"
import {
  getPrimaryQuestionTypeSummary,
  getSeriesPeriodLabel,
  formatAnalyticsLabel,
  getSubscriptionMetrics,
  getVideoLessonsSummary,
  formatPercentRate,
  formatAnalyticsSeriesDate,
  aggregateRevenueByMonth,
  formatRevenueAxisTick,
} from "../../lib/analytics"
import type { DashboardData, DashboardFilters, LabelCount } from "../../types/analytics.types"
import { isUnassignedLabel } from "../../lib/displayValue"
import {
  displayUserAgeGroup,
  displayUserOccupation,
  displayUserRegion,
  displayUserEducationLevel,
  displayUserLearningGoal,
  displayUserLanguageChallenge,
  displayUserCountry,
  displayUserKnowledgeLevel,
  mergeAnalyticsRowsByDisplayLabel,
} from "../../lib/userProfileFieldDisplay"

const PIE_COLORS = ["#9E2891", "#FFD23F", "#1DE9B6", "#C26FC0", "#6366F1", "#F97316", "#14B8A6", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

function genderAnalyticsRowLabel(label: string): string {
  const trimmed = label?.trim() ?? ""
  if (
    isUnassignedLabel(trimmed) ||
    trimmed.toUpperCase() === "OTHER" ||
    trimmed.toLowerCase() === "unknown"
  ) {
    return "unassigned"
  }
  return formatAnalyticsLabel(label)
}

function formatDate(dateStr: string) {
  return formatAnalyticsSeriesDate(dateStr)
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  className,
}: {
  icon: ElementType
  label: string
  value: ReactNode
  sub?: ReactNode
  trend?: "up" | "down" | "neutral"
  className?: string
}) {
  return (
    <Card
      className={cn(
        "border-grayScale-100/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">{label}</div>
            <div className="mt-1.5 text-[1.75rem] font-semibold leading-none tracking-tight text-grayScale-800">{value}</div>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {sub && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-mint-500",
              trend === "down" && "text-destructive",
              (!trend || trend === "neutral") && "text-grayScale-400",
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BreakdownList({
  title,
  data,
  total,
  scrollable: _scrollable,
  formatRowLabel,
}: {
  title: string
  data: LabelCount[]
  total?: number
  scrollable?: boolean
  formatRowLabel?: (label: string) => string
}) {
  const labelFn = formatRowLabel ?? formatAnalyticsLabel
  const merged = mergeAnalyticsRowsByDisplayLabel(data, labelFn).filter(
    (row) => row.label.trim().toUpperCase() !== "OTHER",
  )
  const computedTotal = total ?? merged.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="shadow-none flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        {merged.length > 0 ? (
          <div
            className="space-y-2.5 flex-1 overflow-y-auto overscroll-contain pr-1 max-h-[320px]"
          >
            {merged.map((item, i) => {
              const pct = computedTotal > 0 ? (item.count / computedTotal) * 100 : 0
              const displayLabel = item.label
              return (
                <div key={`${item.label}-${i}`}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate text-grayScale-600" title={displayLabel}>
                        {displayLabel}
                      </span>
                    </div>
                    <span className="font-semibold text-grayScale-700">
                      {item.count.toLocaleString()}
                      <span className="ml-1 font-normal text-grayScale-400">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-grayScale-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-grayScale-400">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

function DonutCard({
  title,
  data,
  centerLabel,
  centerValue,
}: {
  title: string
  data: { name: string; value: number; color: string }[]
  centerLabel?: string
  centerValue?: string
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E0E0E0",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {centerLabel && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold">{centerValue}</span>
                  <span className="text-[10px] text-grayScale-400">{centerLabel}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center space-y-2">
              {data.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-grayScale-600">{s.name}</span>
                  </div>
                  <span className="font-semibold text-grayScale-700">{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-grayScale-400">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}

function Section({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ElementType
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-grayScale-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-grayScale-50/80"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100/60 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1 text-sm font-semibold tracking-wide text-grayScale-800">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="mr-2 text-[10px]">
            {count}
          </Badge>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-grayScale-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-grayScale-100 px-6 pb-6 pt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_FILTERS: DashboardFilters = { mode: "all_time" }

export function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeSummaryTab, setActiveSummaryTab] = useState<"key" | "content" | "operations">("key")
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)

  const fetchData = async (nextFilters: DashboardFilters = filters) => {
    setLoading(true)
    setError(false)
    try {
      const res = await getDashboard(nextFilters)
      setDashboard(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  if (!dashboard && loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-2 sm:px-4">
        <div className="mb-6 text-xs font-semibold uppercase tracking-wide text-grayScale-400">Analytics</div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-grayScale-100 bg-white py-24 shadow-sm">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
          <span className="text-sm font-medium text-grayScale-400">Loading analytics…</span>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-2 sm:px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">Analytics</div>
          <AnalyticsTimeRangeFilter value={filters} onChange={setFilters} />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/30 py-24">
          <img src={alertSrc} alt="" className="h-12 w-12" />
          <span className="text-sm text-destructive">Failed to load analytics data.</span>
          <Button variant="outline" size="sm" onClick={() => fetchData(filters)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { users, subscriptions, payments, courses, content, notifications, team, videos } = dashboard
  const subscriptionMetrics = getSubscriptionMetrics(subscriptions)
  const seriesPeriodLabel = getSeriesPeriodLabel(dashboard.date_filter)
  const lms = courses.lms
  const examPrep = courses.exam_prep

  const registrationData = users.registrations_last_30_days.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }))

  const snapshot = subscriptions.snapshot
  const renewal = subscriptions.renewal
  const periodFilterLabel = getDashboardFilterLabel(filters)
  const newThisPeriod =
    renewal && renewal.first_time_subscriptions + renewal.returning_subscriptions > 0
      ? renewal.first_time_subscriptions + renewal.returning_subscriptions
      : subscriptions.total_subscriptions

  const subscriptionData = subscriptions.new_subscriptions_last_30_days.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }))

  const revenueData = payments.revenue_last_30_days.map((d) => ({
    date: formatDate(d.date),
    revenue: d.revenue,
  }))

  const dateFilter = dashboard.date_filter
  const useMonthlyRevenueTrend =
    dateFilter?.mode === "year" ||
    dateFilter?.mode === "all_time" ||
    filters.mode === "year" ||
    filters.mode === "all_time"
  const monthlyTrendYear =
    (dateFilter?.mode === "year" && dateFilter.year) ||
    (filters.mode === "year" && filters.year) ||
    new Date().getFullYear()
  const monthlyRevenueTrendData = useMonthlyRevenueTrend
    ? aggregateRevenueByMonth(payments.revenue_last_30_days, monthlyTrendYear)
    : revenueData

  const notifByTypePie = notifications.by_type.slice(0, 8).map((s, i) => ({
    name: s.label,
    value: s.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const dropOffData =
    videos?.drop_off_by_checkpoint.map((d) => ({
      checkpoint: `${d.checkpoint_percent}%`,
      checkpointPercent: d.checkpoint_percent,
      dropOffRate: Number((d.drop_off_rate * 100).toFixed(1)),
      viewersReached: d.viewers_reached,
      totalSessions: d.total_sessions,
    })) ?? []

  const retentionData =
    videos?.drop_off_by_checkpoint.map((d) => ({
      checkpoint: `${d.checkpoint_percent}%`,
      viewers: d.viewers_reached,
    })) ?? []

  const generatedAt = new Date(dashboard.generated_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <SensitiveRevealProvider>
    <div className="mx-auto w-full max-w-[1280px] px-2 pb-6 sm:px-4">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-400">Analytics</div>
          <h1 className="text-3xl font-semibold tracking-tight text-grayScale-900">Platform Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-grayScale-400">
            {getDashboardFilterLabel(filters)} · Generated {generatedAt}
          </span>
          <AnalyticsTimeRangeFilter value={filters} onChange={setFilters} />
          <Button variant="outline" size="sm" onClick={() => fetchData(filters)} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-grayScale-100 bg-grayScale-50 px-3 py-2 text-xs text-grayScale-500">
          <img src={spinnerSrc} alt="" className="h-4 w-4 animate-spin" />
          Updating analytics for {getDashboardFilterLabel(filters)}…
        </div>
      )}

      {/* Summary Tabs */}
      <div className="mb-6 rounded-2xl border border-grayScale-100 bg-white px-5 pt-4 shadow-sm">
        <div className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveSummaryTab("key")}
            className={cn(
              "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
              activeSummaryTab === "key" ? "text-brand-600" : "text-grayScale-400 hover:text-grayScale-700",
            )}
          >
            Key Metrics
            {activeSummaryTab === "key" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={() => setActiveSummaryTab("content")}
            className={cn(
              "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
              activeSummaryTab === "content" ? "text-brand-600" : "text-grayScale-400 hover:text-grayScale-700",
            )}
          >
            Content &amp; Platform
            {activeSummaryTab === "content" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={() => setActiveSummaryTab("operations")}
            className={cn(
              "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
              activeSummaryTab === "operations" ? "text-brand-600" : "text-grayScale-400 hover:text-grayScale-700",
            )}
          >
            Operations
            {activeSummaryTab === "operations" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {activeSummaryTab === "key" && (
          <Section title="Key Metrics" icon={TrendingUp} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Users}
                label="Total Users"
                value={formatNumber(users.total_users)}
                sub={`+${users.new_today} today · +${users.new_week} this week · +${users.new_month} this month`}
                trend={users.new_month > 0 ? "up" : "neutral"}
              />
              <KpiCard
                icon={CreditCard}
                label="Active Learners"
                value={formatNumber(snapshot?.active_learners ?? subscriptionMetrics.active)}
                sub={`${formatNumber(snapshot?.active_now ?? subscriptionMetrics.active)} active subs · ${subscriptionMetrics.inactive} inactive`}
                trend={subscriptions.new_month > 0 ? "up" : "neutral"}
              />
              <KpiCard
                icon={DollarSign}
                label="Total Revenue"
                value={
                  <SensitiveValue>
                    {`ETB ${formatNumber(payments.total_revenue)}`}
                  </SensitiveValue>
                }
                sub={
                  <>
                    {payments.successful_payments}/{payments.total_payments} successful · Avg{" "}
                    <SensitiveValue showToggle={false}>
                      ETB {payments.avg_transaction_value.toLocaleString()}
                    </SensitiveValue>
                  </>
                }
                trend={payments.total_revenue > 0 ? "up" : "neutral"}
              />
            </div>
          </Section>
        )}

        {activeSummaryTab === "operations" && (
          <>
        {/* ─── User Analytics ─── */}
        <Section title="User Analytics" icon={Users} count={users.total_users} defaultOpen>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Registrations</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-2xl font-semibold tracking-tight">
                      {users.total_users.toLocaleString()}
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      +{users.new_today} today
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary">{seriesPeriodLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[280px] p-6 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9E2891" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#9E2891" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E0E0E0",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#9E2891" strokeWidth={2} fill="url(#gradUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Profile & demographics
              </p>
              <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <BreakdownList
                  title="Learning goal"
                  data={users.by_learning_goal ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserLearningGoal}
                />
                <BreakdownList
                  title="Language challenge"
                  data={users.by_language_challange ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserLanguageChallenge}
                />
                <BreakdownList
                  title="Occupation"
                  data={users.by_occupation ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserOccupation}
                />
                <BreakdownList
                  title="Age group"
                  data={users.by_age_group ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserAgeGroup}
                />
                <BreakdownList
                  title="Gender"
                  data={users.by_gender ?? []}
                  total={users.total_users}
                  formatRowLabel={genderAnalyticsRowLabel}
                />
                <BreakdownList
                  title="Education level"
                  data={users.by_education_level ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserEducationLevel}
                />
                <BreakdownList
                  title="Country"
                  data={users.by_country ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserCountry}
                />
                <BreakdownList
                  title="Region"
                  data={users.by_region ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserRegion}
                />
                {(users.by_knowledge_level?.length ?? 0) > 0 ? (
                  <BreakdownList
                    title="Knowledge level"
                    data={users.by_knowledge_level ?? []}
                    total={users.total_users}
                    formatRowLabel={displayUserKnowledgeLevel}
                  />
                ) : null}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Learning goals & challenges
              </p>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <BreakdownList
                  title="Learning goal"
                  data={users.by_learning_goal ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserLearningGoal}
                  scrollable
                />
                <BreakdownList
                  title="Language challenge"
                  data={users.by_language_challange ?? []}
                  total={users.total_users}
                  formatRowLabel={displayUserLanguageChallenge}
                  scrollable
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Subscriptions & Revenue ─── */}
        <Section title="Subscriptions & Revenue" icon={DollarSign} defaultOpen={false}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={BadgeCheck}
              label="Active Now"
              value={formatNumber(snapshot?.active_now ?? subscriptionMetrics.active)}
              sub={`${formatNumber(snapshot?.active_learners ?? 0)} learners with access`}
              trend="neutral"
            />
            <KpiCard
              icon={TrendingDown}
              label="Expiring Soon"
              value={formatNumber(snapshot?.expiring_within_7_days ?? 0)}
              sub={`${formatNumber(snapshot?.expiring_within_30_days ?? 0)} within 30 days`}
              trend={(snapshot?.expiring_within_7_days ?? 0) > 0 ? "down" : "neutral"}
            />
            <KpiCard
              icon={RotateCcw}
              label="Expired"
              value={formatNumber(snapshot?.expired_now ?? 0)}
              sub={`${formatNumber(snapshot?.cancelled_now ?? 0)} cancelled · ${formatNumber(snapshot?.pending_now ?? 0)} pending`}
              trend="neutral"
            />
            <KpiCard
              icon={CreditCard}
              label="New This Period"
              value={formatNumber(newThisPeriod)}
              sub={periodFilterLabel}
              trend={newThisPeriod > 0 ? "up" : "neutral"}
            />
            <KpiCard
              icon={Users}
              label="First-time"
              value={formatNumber(renewal?.first_time_subscriptions ?? 0)}
              sub="New subscribers in period"
              trend={(renewal?.first_time_subscriptions ?? 0) > 0 ? "up" : "neutral"}
            />
            <KpiCard
              icon={BadgeCheck}
              label="Resubscribed"
              value={formatNumber(renewal?.returning_subscriptions ?? 0)}
              sub={`${formatNumber(renewal?.resubscribe_after_expiry ?? 0)} after expiry`}
              trend={(renewal?.returning_subscriptions ?? 0) > 0 ? "up" : "neutral"}
            />
            <KpiCard
              icon={TrendingUp}
              label="Average Days to Resubscribe"
              value={(renewal?.avg_days_to_resubscribe ?? 0).toFixed(1)}
              sub={`Median ${(renewal?.median_days_to_resubscribe ?? 0).toFixed(1)} days`}
              trend="neutral"
            />
          </div>

          <div className="mt-6 space-y-4">
            <MonthlyRevenueTrendPanel
              subtitle={
                useMonthlyRevenueTrend
                  ? `Revenue over ${monthlyTrendYear}`
                  : `Revenue over ${seriesPeriodLabel.toLowerCase()}`
              }
              ytdValue={<SensitiveYtdValue amount={payments.total_revenue} />}
              ytdLabel="Period total"
            >
              <MonthlyRevenueAreaChart
                data={monthlyRevenueTrendData}
                xKey={useMonthlyRevenueTrend ? "month" : "date"}
                gradientId="analyticsSubsRevenueFill"
                height={260}
                yTickFormatter={formatRevenueAxisTick}
              />
            </MonthlyRevenueTrendPanel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className={analyticsSoftCardClass}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>New Subscriptions</CardTitle>
                      <div className="mt-1 text-xs text-grayScale-400">
                        Daily new subscriptions · {periodFilterLabel}
                      </div>
                    </div>
                    <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-[240px] p-6 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={subscriptionData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSubAnalytics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8E248D" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#8E248D" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#EEEEEE" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#9E9E9E" }} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} allowDecimals={false} tick={{ fill: "#9E9E9E" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E8E8E8",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Subscriptions"
                        stroke="#8E248D"
                        strokeWidth={2.5}
                        fill="url(#gradSubAnalytics)"
                        dot={{ r: 3.5, fill: "#8E248D", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className={analyticsSoftCardClass}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Daily Revenue</CardTitle>
                      <div className="mt-1 text-xs text-grayScale-400">
                        Successful payments · ETB · {periodFilterLabel}
                      </div>
                    </div>
                    <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-[240px] p-6 pt-2">
                  <SensitiveChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} stroke="#EEEEEE" strokeDasharray="4 4" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#9E9E9E" }} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} width={42} tick={{ fill: "#9E9E9E" }} />
                        <Tooltip
                          formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, "Revenue"]}
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid #E8E8E8",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#8E248D" />
                      </BarChart>
                    </ResponsiveContainer>
                  </SensitiveChart>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        {/* ─── Notifications ─── */}
        <Section title="Notifications" icon={Bell} count={notifications.total_sent} defaultOpen={false}>
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DonutCard
              title="Notification Types"
              data={notifByTypePie}
              centerValue={notifications.total_sent.toString()}
              centerLabel="Sent"
            />
            <BreakdownList title="Notifications by Channel" data={notifications.by_channel} total={notifications.total_sent} />
            <BreakdownList title="Notifications by Type" data={notifications.by_type} total={notifications.total_sent} />
          </div>
        </Section>

        {/* ─── Team ─── */}
        <Section title="Team" icon={UsersRound} count={team.total_members} defaultOpen={false}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <BreakdownList title="Team by Role" data={team.by_role} total={team.total_members} />
            <BreakdownList title="Team by Status" data={team.by_status} total={team.total_members} />
          </div>
        </Section>

          </>
        )}

        {activeSummaryTab === "content" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={FolderOpen}
                label="Categories"
                value={courses.total_categories.toLocaleString()}
                sub={`${courses.total_courses} courses · ${courses.total_sub_courses} modules`}
                trend="neutral"
              />
              <KpiCard
                icon={BookOpen}
                label="LMS Programs"
                value={(lms?.programs ?? 0).toLocaleString()}
                sub={`${lms?.courses ?? 0} courses · ${lms?.practices ?? 0} practices`}
                trend="neutral"
              />
              <KpiCard
                icon={Video}
                label="Videos"
                value={courses.total_videos.toLocaleString()}
                sub={getVideoLessonsSummary(lms?.lessons_with_video, examPrep?.lessons_with_video)}
                trend={courses.total_videos > 0 ? "up" : "neutral"}
              />
              <KpiCard
                icon={HelpCircle}
                label="Questions"
                value={content.total_questions.toLocaleString()}
                sub={getPrimaryQuestionTypeSummary(content.questions_by_type)}
                trend={content.total_questions > 0 ? "up" : "neutral"}
              />
            </div>

        {/* ─── Course Management ─── */}
        {(lms || examPrep) && (
          <Section title="Course Management" icon={BookOpen} count={courses.total_videos} defaultOpen>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {lms && (
                <BreakdownList
                  title="LMS"
                  data={[
                    { label: "Programs", count: lms.programs },
                    { label: "Courses", count: lms.courses },
                    { label: "Modules", count: lms.modules },
                    { label: "Lessons", count: lms.lessons },
                    { label: "Lessons with video", count: lms.lessons_with_video },
                    { label: "Practices", count: lms.practices },
                    { label: "Practices at course", count: lms.practices_at_course },
                    { label: "Practices at module", count: lms.practices_at_module },
                    { label: "Practices at lesson", count: lms.practices_at_lesson },
                  ]}
                />
              )}
              {examPrep && (
                <BreakdownList
                  title="Duolingo/IELTS"
                  data={[
                    { label: "Catalog courses", count: examPrep.catalog_courses },
                    { label: "Units", count: examPrep.units },
                    { label: "Unit modules", count: examPrep.unit_modules },
                    { label: "Lessons", count: examPrep.lessons },
                    { label: "Lessons with video", count: examPrep.lessons_with_video },
                    { label: "Lesson practices", count: examPrep.lesson_practices },
                  ]}
                />
              )}
            </div>
          </Section>
        )}

        {/* ─── Content Breakdown ─── */}
        <Section title="Content Breakdown" icon={HelpCircle} count={content.total_questions} defaultOpen={false}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <BreakdownList title="Questions by Type" data={content.questions_by_type} />
            <BreakdownList title="Question Sets by Type" data={content.question_sets_by_type} />
          </div>
        </Section>

        {/* ─── Video Analytics ─── */}
        {videos && (
          <Section title="Video Analytics" icon={PlayCircle} count={videos.total_watch_sessions} defaultOpen={false}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={PlayCircle}
                label="Watch Sessions"
                value={formatNumber(videos.total_watch_sessions)}
                sub={`${videos.unique_video_starts.toLocaleString()} unique starts`}
                trend={videos.total_watch_sessions > 0 ? "up" : "neutral"}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Completion Rate"
                value={formatPercentRate(videos.completion_rate)}
                sub={`${videos.completed_sessions.toLocaleString()} completed sessions`}
                trend={videos.completion_rate >= 0.25 ? "up" : "neutral"}
              />
              <KpiCard
                icon={RotateCcw}
                label="Replay Rate"
                value={formatPercentRate(videos.replay_rate)}
                sub={`${videos.replay_sessions.toLocaleString()} replays · ${videos.users_who_replayed.toLocaleString()} users`}
                trend={videos.replay_rate > 0 ? "up" : "neutral"}
              />
              <KpiCard
                icon={Video}
                label="Unique Starts"
                value={formatNumber(videos.unique_video_starts)}
                sub={`${videos.completed_sessions.toLocaleString()} completed · ${videos.replay_sessions.toLocaleString()} replays`}
                trend="neutral"
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Viewer Retention by Checkpoint</CardTitle>
                      <div className="mt-1 text-xs text-grayScale-400">
                        Viewers still watching at each progress milestone
                      </div>
                    </div>
                    <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-[280px] p-6 pt-2">
                  {retentionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retentionData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradRetention" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                        <XAxis dataKey="checkpoint" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} allowDecimals={false} />
                        <Tooltip
                          formatter={(v) => [Number(v).toLocaleString(), "Viewers"]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E0E0E0",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="viewers"
                          stroke="#6366F1"
                          strokeWidth={2}
                          fill="url(#gradRetention)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-grayScale-400">
                      No checkpoint data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Drop-off Rate by Checkpoint</CardTitle>
                      <div className="mt-1 text-xs text-grayScale-400">
                        Share of sessions that stopped before each milestone
                      </div>
                    </div>
                    <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-[280px] p-6 pt-2">
                  {dropOffData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dropOffData} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                        <XAxis dataKey="checkpoint" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          width={42}
                          tickFormatter={(v) => `${v}%`}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          formatter={(v, _name, props) => {
                            const row = props?.payload as (typeof dropOffData)[number] | undefined
                            return [
                              `${Number(v).toFixed(1)}% drop-off`,
                              `${row?.viewersReached?.toLocaleString() ?? 0} viewers reached`,
                            ]
                          }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E0E0E0",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="dropOffRate" radius={[6, 6, 0, 0]} fill="#F97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-grayScale-400">
                      No drop-off data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {dropOffData.length > 0 && (
              <div className="mt-4">
                <BreakdownList
                  title="Checkpoint Funnel"
                  data={dropOffData.map((d) => ({
                    label: `${d.checkpointPercent}% — ${d.viewersReached} viewers (${d.dropOffRate}% drop-off)`,
                    count: d.viewersReached,
                  }))}
                  total={videos.total_watch_sessions}
                />
              </div>
            )}
          </Section>
        )}

          </>
        )}
      </div>
    </div>
    </SensitiveRevealProvider>
  )
}
