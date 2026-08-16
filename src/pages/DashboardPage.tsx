import {
  // Activity,
  BadgeCheck,
  Video,
  // Coins,
  DollarSign,
  HelpCircle,
  MessageSquare,
  Star,
  // TrendingUp,
  Users,
  UserX,
  Bell,
  CreditCard,
  UsersRound,
} from "lucide-react"
import spinnerSrc from "../assets/Circular-indeterminate progress indicator.svg"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { RevenueTrendCard } from "../components/dashboard/RevenueTrendCard"
import { StatCard } from "../components/dashboard/StatCard"
import {
  ActivePlansBreakdownCard,
  RenewalRateCard,
  DonutBreakdownCard,
  analyticsSoftCardClass,
  labelCountsToPieSlices,
  SUBSCRIPTION_CHART_COLORS,
} from "../components/analytics/SubscriptionRevenueVisuals"
import alertSrc from "../assets/Alert.svg"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { SensitiveRevealProvider, SensitiveValue } from "../components/ui/sensitive-value"
import { cn } from "../lib/utils"
import { getTeamMemberById } from "../api/team.api"
import { getDashboard } from "../api/analytics.api"
import { getSubscriptionPlans } from "../api/subscription-plans.api"
import { getRatingSummary, listRatingsByTarget } from "../api/ratings.api"
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { AnalyticsTimeRangeFilter, getDashboardFilterLabel } from "../components/analytics/AnalyticsTimeRangeFilter"
import {
  formatAnalyticsSeriesDate,
  getPrimaryQuestionTypeSummary,
  getSeriesPeriodLabel,
  getSubscriptionMetrics,
  getVideoLessonsSummary,
  buildSubscriptionStatusPie,
} from "../lib/analytics"
import type { DashboardData, DashboardFilters } from "../types/analytics.types"
import { formatAppDateTime } from "../lib/datetime"
import { formatAverageStars } from "../lib/ratingsDisplay"
import { formatPlanDuration } from "../lib/subscriptionPlans"
import type { SubscriptionPlan } from "../types/subscription.types"
import type { Rating, RatingSummary } from "../types/ratings.types"

const PIE_COLORS = SUBSCRIPTION_CHART_COLORS
const CHART_BRAND = SUBSCRIPTION_CHART_COLORS[0]
const chartTooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E8E8E8",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 12,
}

function DashboardSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-grayScale-400">{children}</h2>
  )
}

function formatDate(dateStr: string) {
  return formatAnalyticsSeriesDate(dateStr)
}

const DEFAULT_FILTERS: DashboardFilters = { mode: "all_time" }

export function DashboardPage() {
  const [userFirstName, setUserFirstName] = useState<string>("")
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStatTab, setActiveStatTab] = useState<"primary" | "secondary">("primary")
  const [appRatings, setAppRatings] = useState<Rating[]>([])
  const [appRatingsSummary, setAppRatingsSummary] = useState<RatingSummary>({
    total_count: 0,
    average_stars: 0,
  })
  const [appRatingsLoading, setAppRatingsLoading] = useState(true)
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const memberId = Number(localStorage.getItem("member_id"))
        const res = await getTeamMemberById(memberId)
        const member = res.data.data

        setUserFirstName(member.first_name)
        localStorage.setItem("user_first_name", member.first_name)
        localStorage.setItem("user_last_name", member.last_name)
        window.dispatchEvent(new Event("user-profile-updated"))
      } catch (err) {
        console.error(err)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchAppRatings = async () => {
      try {
        const [summary, reviews] = await Promise.all([
          getRatingSummary({ target_type: "app", target_id: 0 }),
          listRatingsByTarget({ target_type: "app", target_id: 0, limit: 5, offset: 0 }),
        ])
        setAppRatingsSummary(summary)
        setAppRatings(reviews)
      } catch (err) {
        console.error(err)
      } finally {
        setAppRatingsLoading(false)
      }
    }

    fetchAppRatings()
  }, [])

  useEffect(() => {
    const fetchPlans = async () => {
      setSubscriptionPlansLoading(true)
      try {
        const res = await getSubscriptionPlans({ active_only: false })
        setSubscriptionPlans(res.data)
      } catch (err) {
        console.error(err)
        setSubscriptionPlans([])
      } finally {
        setSubscriptionPlansLoading(false)
      }
    }

    fetchPlans()
  }, [])

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await getDashboard(filters)
        setDashboard(res.data)
      } catch (err) {
        console.error(err)
        setDashboard(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [filters])

  const registrationData =
    dashboard?.users.registrations_last_30_days.map((d) => ({
      date: formatDate(d.date),
      count: d.count,
    })) ?? []

  const subscriptionStatusData = buildSubscriptionStatusPie(
    dashboard?.subscriptions.by_status,
    PIE_COLORS,
  )

  const seriesPeriodLabel = dashboard ? getSeriesPeriodLabel(dashboard.date_filter) : "Last 30 Days"
  const subscriptionMetrics = dashboard
    ? getSubscriptionMetrics(dashboard.subscriptions)
    : null

  const generatedAt = dashboard ? formatAppDateTime(dashboard.generated_at) : ""

  const registrationPeakIndex = registrationData.reduce((best, row, idx) => {
    return row.count > (registrationData[best]?.count ?? 0) ? idx : best
  }, 0)

  return (
    <SensitiveRevealProvider>
    <div className="mx-auto w-full min-w-0 max-w-[1280px] px-2 pb-8 sm:px-4">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
            Dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-grayScale-900">
            Welcome back, {userFirstName || localStorage.getItem("user_first_name") || "there"}
          </h1>
          <p className="mt-1.5 text-sm text-grayScale-500">
            Snapshot for {getDashboardFilterLabel(filters)}
            {dashboard ? ` · Updated ${generatedAt}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/analytics"
            className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-500"
          >
            Full analytics →
          </Link>
          <AnalyticsTimeRangeFilter value={filters} onChange={setFilters} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-grayScale-100 bg-white py-24 shadow-sm">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
          <span className="text-sm font-medium text-grayScale-400">Loading dashboard…</span>
        </div>
      ) : !dashboard ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/40 py-24">
          <img src={alertSrc} alt="" className="h-12 w-12" />
          <span className="text-sm font-medium text-destructive">Failed to load dashboard data.</span>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-grayScale-100 bg-white px-5 pt-4 shadow-sm">
            <div className="-mb-px flex gap-6">
              <button
                type="button"
                onClick={() => setActiveStatTab("primary")}
                className={cn(
                  "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
                  activeStatTab === "primary"
                    ? "text-brand-600"
                    : "text-grayScale-400 hover:text-grayScale-700",
                )}
              >
                Overview
                {activeStatTab === "primary" && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveStatTab("secondary")}
                className={cn(
                  "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
                  activeStatTab === "secondary"
                    ? "text-brand-600"
                    : "text-grayScale-400 hover:text-grayScale-700",
                )}
              >
                More metrics
                {activeStatTab === "secondary" && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
                )}
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          {activeStatTab === "primary" && (
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={dashboard.users.total_users.toLocaleString()}
                deltaLabel={`+${dashboard.users.new_month} this month`}
                deltaPositive={dashboard.users.new_month > 0}
              />
              <StatCard
                icon={CreditCard}
                label="Payments"
                value={dashboard.payments.total_payments.toLocaleString()}
                deltaLabel={`${dashboard.payments.successful_payments} successful`}
                deltaPositive={dashboard.payments.successful_payments > 0}
              />
              <StatCard
                icon={DollarSign}
                label="Total Revenue (ETB)"
                value={
                  <SensitiveValue>
                    {dashboard.payments.total_revenue.toLocaleString()}
                  </SensitiveValue>
                }
                deltaLabel={`${dashboard.payments.total_payments} payments`}
                deltaPositive={dashboard.payments.total_revenue > 0}
              />
            </div>
          )}

          {/* Secondary Stats */}
          {activeStatTab === "secondary" && subscriptionMetrics && (
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={CreditCard}
                label="Total Subscriptions"
                value={subscriptionMetrics.total.toLocaleString()}
                deltaLabel={`+${dashboard.subscriptions.new_month} this month`}
                deltaPositive={dashboard.subscriptions.new_month > 0}
              />
              <StatCard
                icon={BadgeCheck}
                label="Active Subscriptions"
                value={subscriptionMetrics.active.toLocaleString()}
                deltaLabel={`+${dashboard.subscriptions.new_today} today · +${dashboard.subscriptions.new_week} this week`}
                deltaPositive={subscriptionMetrics.active > 0}
              />
              <StatCard
                icon={UserX}
                label="Inactive Subscriptions"
                value={subscriptionMetrics.inactive.toLocaleString()}
                deltaLabel={
                  dashboard.subscriptions.by_status.length > 0
                    ? "From subscription status breakdown"
                    : "Total minus active"
                }
                deltaPositive={subscriptionMetrics.inactive === 0}
                trend="neutral"
              />
              <StatCard
                icon={Video}
                label="Videos"
                value={dashboard.courses.total_videos.toLocaleString()}
                deltaLabel={getVideoLessonsSummary(
                  dashboard.courses.lms?.lessons_with_video,
                  dashboard.courses.exam_prep?.lessons_with_video,
                )}
                deltaPositive={dashboard.courses.total_videos > 0}
              />
              <StatCard
                icon={HelpCircle}
                label="Questions"
                value={dashboard.content.total_questions.toLocaleString()}
                deltaLabel={getPrimaryQuestionTypeSummary(dashboard.content.questions_by_type)}
                deltaPositive={dashboard.content.total_questions > 0}
              />
              <StatCard
                icon={Bell}
                label="Notifications"
                value={dashboard.notifications.total_sent.toLocaleString()}
                deltaLabel={`${dashboard.notifications.unread_count} unread`}
                deltaPositive={dashboard.notifications.unread_count === 0}
                trend={dashboard.notifications.unread_count > 0 ? "neutral" : "up"}
              />
              <StatCard
                icon={UsersRound}
                label="Team Members"
                value={dashboard.team.total_members.toLocaleString()}
                deltaLabel={`${dashboard.team.by_role.length} roles`}
                deltaPositive
                trend="neutral"
              />
            </div>
          )}

          <div className="space-y-8">
            <section className="space-y-4">
              <DashboardSectionTitle>Growth</DashboardSectionTitle>
            <Card className={cn(analyticsSoftCardClass)}>
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-grayScale-900">
                      User Registrations
                    </CardTitle>
                    <p className="mt-1 text-xs text-grayScale-400">
                      New sign-ups over {seriesPeriodLabel.toLowerCase()}
                    </p>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-grayScale-900">
                      {dashboard.users.total_users.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs font-medium text-mint-500">
                      +{dashboard.users.new_today} today · +{dashboard.users.new_week} this week
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-semibold">
                    {seriesPeriodLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[280px] px-5 pb-5 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationData} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRegFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_BRAND} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={CHART_BRAND} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EEEEEE" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "#9E9E9E" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={36}
                      allowDecimals={false}
                      tick={{ fill: "#9E9E9E" }}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={CHART_BRAND}
                      strokeWidth={2.75}
                      fill="url(#dashboardRegFill)"
                      dot={(props) => {
                        const { cx, cy, index } = props
                        if (cx == null || cy == null) return null
                        const highlight = index === registrationPeakIndex
                        return (
                          <circle
                            key={`reg-dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={highlight ? 5.5 : 3.5}
                            fill={CHART_BRAND}
                            stroke="#fff"
                            strokeWidth={highlight ? 2 : 1}
                          />
                        )
                      }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            </section>

            <section className="space-y-4">
              <DashboardSectionTitle>Revenue &amp; subscriptions</DashboardSectionTitle>
            <div className="grid gap-4">
              <RevenueTrendCard paymentMethod={filters.payment_method} />

              <div className="grid gap-4 lg:grid-cols-2">
                <ActivePlansBreakdownCard
                  data={labelCountsToPieSlices(
                    (dashboard.subscriptions.active_by_plan?.length
                      ? dashboard.subscriptions.active_by_plan
                      : dashboard.subscriptions.by_status
                    ).map((row) => ({
                      label: row.label,
                      count: row.count,
                    })),
                  )}
                />
                <RenewalRateCard
                  renewalRate={dashboard.subscriptions.renewal?.renewal_rate ?? 0}
                  autoRenewCount={dashboard.subscriptions.snapshot?.auto_renew_enabled ?? 0}
                  cancelledCount={dashboard.subscriptions.snapshot?.cancelled_now ?? 0}
                  activeNow={
                    dashboard.subscriptions.snapshot?.active_now ??
                    subscriptionMetrics?.active ??
                    0
                  }
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {subscriptionStatusData.length > 0 ? (
                  <DonutBreakdownCard
                    title="Subscription Status"
                    data={subscriptionStatusData}
                    countSuffix="Subscriptions"
                  />
                ) : null}
              </div>
            </div>
            </section>

            <section className="space-y-4">
              <DashboardSectionTitle>Catalog &amp; feedback</DashboardSectionTitle>
            <Card className={cn(analyticsSoftCardClass)}>
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100/60 text-brand-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-grayScale-900">
                      Subscription plans
                    </CardTitle>
                    <p className="text-sm text-grayScale-500">Available billing plans for learners.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2">
                {subscriptionPlansLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm text-grayScale-400">
                    No subscription plans found
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {subscriptionPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex flex-col rounded-xl border border-grayScale-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200/60 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-grayScale-700">{plan.name}</h3>
                          <Badge variant={plan.is_active ? "success" : "secondary"}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {plan.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-grayScale-500">{plan.description}</p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-grayScale-200 pt-4">
                          <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-grayScale-400">Price</div>
                            <div className="text-lg font-semibold text-brand-600">
                              {plan.currency}{" "}
                              {Number.isInteger(plan.price)
                                ? plan.price.toLocaleString()
                                : plan.price.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium uppercase tracking-wide text-grayScale-400">
                              Billing
                            </div>
                            <div className="text-sm font-semibold text-grayScale-600">{formatPlanDuration(plan)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(analyticsSoftCardClass)}>
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100/60 text-brand-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-grayScale-900">
                      Recent App Reviews
                    </CardTitle>
                  </div>
                  <Link
                    to="/app-reviews"
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-100/40"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2">
                {appRatingsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
                  </div>
                ) : appRatingsSummary.total_count === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm text-grayScale-400">
                    No app reviews yet
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-grayScale-100 bg-gradient-to-r from-amber-50/80 to-white px-4 py-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < Math.round(appRatingsSummary.average_stars)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-grayScale-200 text-grayScale-200",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-grayScale-600">
                        {formatAverageStars(appRatingsSummary.average_stars)}
                      </span>
                      <span className="text-xs text-grayScale-400">
                        ({appRatingsSummary.total_count}{" "}
                        {appRatingsSummary.total_count === 1 ? "review" : "reviews"})
                      </span>
                    </div>

                    <div className="divide-y divide-grayScale-100">
                      {appRatings.map((rating) => (
                        <div key={rating.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                            U{rating.user_id}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-grayScale-600">
                                User #{rating.user_id}
                              </span>
                              <span className="shrink-0 text-xs text-grayScale-400">
                                {formatDate(rating.created_at)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    i < rating.stars
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-grayScale-200 text-grayScale-200",
                                  )}
                                />
                              ))}
                            </div>
                            {rating.review && (
                              <p className="mt-1 text-sm text-grayScale-500">{rating.review}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            </section>
          </div>
        </>
      )}
    </div>
    </SensitiveRevealProvider>
  )
}
