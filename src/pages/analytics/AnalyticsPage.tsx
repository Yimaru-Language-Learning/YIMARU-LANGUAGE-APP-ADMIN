import { useEffect, useState } from "react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  // Legend,
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
  TicketCheck,
  UsersRound,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Video,
  Layers,
  FolderOpen,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"
import { getDashboard } from "../../api/analytics.api"
import { AnalyticsTimeRangeFilter, getDashboardFilterLabel } from "../../components/analytics/AnalyticsTimeRangeFilter"
import {
  getPrimaryQuestionTypeSummary,
  getSeriesPeriodLabel,
  getVideoLessonsSummary,
} from "../../lib/analytics"
import type { DashboardData, DashboardFilters, LabelCount } from "../../types/analytics.types"

const PIE_COLORS = ["#9E2891", "#FFD23F", "#1DE9B6", "#C26FC0", "#6366F1", "#F97316", "#14B8A6", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
  icon: React.ElementType
  label: string
  value: string
  sub?: string
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
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
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
}: {
  title: string
  data: LabelCount[]
  total?: number
}) {
  const computedTotal = total ?? data.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {data.length > 0 ? (
          <div className="space-y-2.5">
            {data.map((item, i) => {
              const pct = computedTotal > 0 ? (item.count / computedTotal) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-grayScale-600">{item.label}</span>
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
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
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

  const { users, subscriptions, payments, courses, content, notifications, issues, team } = dashboard
  const seriesPeriodLabel = getSeriesPeriodLabel(dashboard.date_filter)
  const lms = courses.lms
  const examPrep = courses.exam_prep

  const registrationData = users.registrations_last_30_days.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }))

  const subscriptionData = subscriptions.new_subscriptions_last_30_days.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }))

  const revenueData = payments.revenue_last_30_days.map((d) => ({
    date: formatDate(d.date),
    revenue: d.revenue,
  }))

  const issueStatusPie = issues.by_status.map((s, i) => ({
    name: s.label,
    value: s.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const subscriptionStatusPie = subscriptions.by_status.map((s, i) => ({
    name: s.label,
    value: s.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const notifByTypePie = notifications.by_type.slice(0, 8).map((s, i) => ({
    name: s.label,
    value: s.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const generatedAt = new Date(dashboard.generated_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
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
          <>
            {/* ─── Key Metrics ─── */}
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
                  icon={BadgeCheck}
                  label="Active Subscriptions"
                  value={formatNumber(subscriptions.active_subscriptions)}
                  sub={`${subscriptions.total_subscriptions} total · +${subscriptions.new_month} this month`}
                  trend={subscriptions.new_month > 0 ? "up" : "neutral"}
                />
                <KpiCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={`ETB ${formatNumber(payments.total_revenue)}`}
                  sub={`${payments.successful_payments}/${payments.total_payments} successful · Avg ETB ${payments.avg_transaction_value.toLocaleString()}`}
                  trend={payments.total_revenue > 0 ? "up" : "neutral"}
                />
                <KpiCard
                  icon={TicketCheck}
                  label="Issue Resolution"
                  value={`${(issues.resolution_rate * 100).toFixed(1)}%`}
                  sub={`${issues.resolved_issues} resolved of ${issues.total_issues} total`}
                  trend={issues.resolution_rate >= 0.5 ? "up" : "down"}
                />
              </div>
            </Section>
          </>
        )}

        {activeSummaryTab === "content" && (
          <>
            {/* ─── Content & Platform ─── */}
            <Section
              title="Content & Platform"
              icon={BookOpen}
              count={courses.total_videos + content.total_questions}
              defaultOpen
            >
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
            </Section>
          </>
        )}

        {activeSummaryTab === "operations" && (
          <>
            {/* ─── Operations ─── */}
            <Section title="Operations" icon={Bell} defaultOpen>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={Bell}
                  label="Notifications Sent"
                  value={formatNumber(notifications.total_sent)}
                  sub={`${notifications.read_count} read · ${notifications.unread_count} unread`}
                  trend={notifications.unread_count === 0 ? "up" : "neutral"}
                />
                <KpiCard
                  icon={UsersRound}
                  label="Team Members"
                  value={team.total_members.toLocaleString()}
                  sub={`${team.by_role.length} roles`}
                  trend="neutral"
                />
                <KpiCard
                  icon={CreditCard}
                  label="Payments"
                  value={payments.total_payments.toLocaleString()}
                  sub={`${payments.successful_payments} successful`}
                  trend={payments.successful_payments > 0 ? "up" : "neutral"}
                />
                <KpiCard
                  icon={Layers}
                  label="Question Sets"
                  value={content.total_question_sets.toLocaleString()}
                  sub={content.question_sets_by_type.map((q) => `${q.count} ${q.label.toLowerCase()}`).join(" · ")}
                  trend="neutral"
                />
              </div>
            </Section>
          </>
        )}

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
          <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BreakdownList title="Users by Role" data={users.by_role} total={users.total_users} />
            <BreakdownList title="Users by Region" data={users.by_region} total={users.total_users} />
            <BreakdownList title="Users by Knowledge Level" data={users.by_knowledge_level} total={users.total_users} />
            <BreakdownList title="Users by Status" data={users.by_status} total={users.total_users} />
            <BreakdownList title="Users by Age Group" data={users.by_age_group} total={users.total_users} />
          </div>
        </Section>

        {/* ─── Subscriptions & Revenue ─── */}
        <Section title="Subscriptions & Revenue" icon={DollarSign} defaultOpen={false}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>New Subscriptions</CardTitle>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">
                      {subscriptions.total_subscriptions.toLocaleString()}
                    </div>
                    <div className="text-xs text-grayScale-400">
                      +{subscriptions.new_today} today · +{subscriptions.new_week} this week
                    </div>
                  </div>
                  <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[240px] p-6 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subscriptionData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
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
                    <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fill="url(#gradSub)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue</CardTitle>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">
                      ETB {payments.total_revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-grayScale-400">Daily revenue over last 30 days</div>
                  </div>
                  <Badge variant="secondary">{seriesPeriodLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[240px] p-6 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={42} />
                    <Tooltip
                      formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, "Revenue"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E0E0E0",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#9E2891" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
            <DonutCard
              title="Subscription Status"
              data={subscriptionStatusPie}
              centerValue={subscriptions.total_subscriptions.toString()}
              centerLabel="Total"
            />
            <BreakdownList title="Payments by Method" data={payments.by_method} total={payments.total_payments} />
            <BreakdownList title="Payments by Status" data={payments.by_status} total={payments.total_payments} />
          </div>
        </Section>

        {/* ─── Issues & Support ─── */}
        <Section title="Issues & Support" icon={TicketCheck} count={issues.total_issues} defaultOpen={false}>
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <DonutCard
              title="Issue Status"
              data={issueStatusPie}
              centerValue={issues.total_issues.toString()}
              centerLabel="Total"
            />
            <BreakdownList title="Issues by Type" data={issues.by_type} total={issues.total_issues} />
            <BreakdownList title="Issues by Status" data={issues.by_status} total={issues.total_issues} />
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

        {/* ─── Course Management ─── */}
        {(lms || examPrep) && (
          <Section title="Course Management" icon={BookOpen} count={courses.total_videos} defaultOpen={false}>
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
                  title="Exam prep"
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

        {/* ─── Team ─── */}
        <Section title="Team" icon={UsersRound} count={team.total_members} defaultOpen={false}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <BreakdownList title="Team by Role" data={team.by_role} total={team.total_members} />
            <BreakdownList title="Team by Status" data={team.by_status} total={team.total_members} />
          </div>
        </Section>
      </div>
    </div>
  )
}
