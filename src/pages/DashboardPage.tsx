import {
  // Activity,
  BadgeCheck,
  Video,
  // Coins,
  DollarSign,
  HelpCircle,
  MessageSquare,
  Star,
  TicketCheck,
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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { RevenueTrendCard } from "../components/dashboard/RevenueTrendCard"
import { StatCard } from "../components/dashboard/StatCard"
import alertSrc from "../assets/Alert.svg"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { SensitiveRevealProvider, SensitiveValue } from "../components/ui/sensitive-value"
import { cn } from "../lib/utils"
import { getTeamMemberById } from "../api/team.api"
import { getDashboard } from "../api/analytics.api"
import { getSubscriptionPlans } from "../api/subscription-plans.api"
import { getRatingSummary, listRatingsByTarget } from "../api/ratings.api"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnalyticsTimeRangeFilter } from "../components/analytics/AnalyticsTimeRangeFilter"
import {
  getPrimaryQuestionTypeSummary,
  getSeriesPeriodLabel,
  getSubscriptionMetrics,
  getVideoLessonsSummary,
} from "../lib/analytics"
import type { DashboardData, DashboardFilters } from "../types/analytics.types"
import { formatAverageStars } from "../lib/ratingsDisplay"
import { formatPlanDuration } from "../lib/subscriptionPlans"
import type { SubscriptionPlan } from "../types/subscription.types"
import type { Rating, RatingSummary } from "../types/ratings.types"

const PIE_COLORS = ["#9E2891", "#FFD23F", "#1DE9B6", "#C26FC0", "#6366F1", "#F97316", "#14B8A6", "#EF4444"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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

  const subscriptionStatusData =
    dashboard?.subscriptions.by_status.map((s, i) => ({
      name: s.label,
      value: s.count,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })) ?? []

  const issueStatusData =
    dashboard?.issues.by_status.map((s, i) => ({
      name: s.label,
      value: s.count,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })) ?? []

  const seriesPeriodLabel = dashboard ? getSeriesPeriodLabel(dashboard.date_filter) : "Last 30 Days"
  const subscriptionMetrics = dashboard
    ? getSubscriptionMetrics(dashboard.subscriptions)
    : null

  return (
    <SensitiveRevealProvider>
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-grayScale-500">Dashboard</div>
        <AnalyticsTimeRangeFilter value={filters} onChange={setFilters} />
      </div>
      <div className="mb-5 text-2xl font-semibold tracking-tight">
        Welcome, {userFirstName || localStorage.getItem("user_first_name")}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
          <span className="text-sm font-medium text-grayScale-400">Loading dashboard…</span>
        </div>
      ) : !dashboard ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <img src={alertSrc} alt="" className="h-12 w-12" />
          <span className="text-sm font-medium text-destructive">Failed to load dashboard data.</span>
        </div>
      ) : (
        <>
          {/* Stat tabs */}
          <div className="mb-3 border-b border-grayScale-200">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <StatCard
                icon={TicketCheck}
                label="Issues"
                value={`${dashboard.issues.resolved_issues}/${dashboard.issues.total_issues}`}
                deltaLabel={`${(dashboard.issues.resolution_rate * 100).toFixed(1)}% resolved`}
                deltaPositive={dashboard.issues.resolution_rate > 0.5}
              />
            </div>
          )}

          {/* Secondary Stats */}
          {activeStatTab === "secondary" && subscriptionMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              />
              <StatCard
                icon={UsersRound}
                label="Team Members"
                value={dashboard.team.total_members.toLocaleString()}
                deltaLabel={`${dashboard.team.by_role.length} roles`}
                deltaPositive
              />
            </div>
          )}

          {/* User Registrations Chart */}
          <div className="mt-5 grid gap-4">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>User Registrations</CardTitle>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">
                      {dashboard.users.total_users.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-mint-500">
                      +{dashboard.users.new_today} today · +{dashboard.users.new_week} this week
                    </div>
                  </div>
                  <div className="rounded-full bg-grayScale-100 px-3 py-1 text-xs font-semibold text-grayScale-500">
                    {seriesPeriodLabel}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[280px] p-6 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9E2891" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#9E2891" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E0E0E0",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#9E2891"
                      strokeWidth={2}
                      fill="url(#fillBrand)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Subscription / Issue Status Pie */}
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle>
                    {subscriptionStatusData.length > 0 ? "Subscription Status" : "Issue Status"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-6 pt-2 md:grid-cols-2">
                  {(subscriptionStatusData.length > 0 ? subscriptionStatusData : issueStatusData).length > 0 ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subscriptionStatusData.length > 0 ? subscriptionStatusData : issueStatusData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={2}
                            >
                              {(subscriptionStatusData.length > 0 ? subscriptionStatusData : issueStatusData).map(
                                (entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ),
                              )}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: "1px solid #E0E0E0",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {(subscriptionStatusData.length > 0 ? subscriptionStatusData : issueStatusData).map((s) => (
                          <div key={s.name} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              <span className="text-grayScale-600">{s.name}</span>
                            </div>
                            <span className="font-semibold text-grayScale-600">{s.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex items-center justify-center py-10 text-sm text-grayScale-400">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <RevenueTrendCard />
            </div>

            {/* Subscription plans (from catalog API) */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-500" />
                  <CardTitle>Subscription plans</CardTitle>
                </div>
                <p className="text-sm text-grayScale-500">Available billing plans for learners.</p>
              </CardHeader>
              <CardContent className="p-6 pt-2">
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
                        className="flex flex-col rounded-xl border border-grayScale-200 bg-grayScale-50/50 p-4"
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

            {/* App Ratings */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-brand-500" />
                    <CardTitle>Recent App Reviews</CardTitle>
                  </div>
                  <Link
                    to="/app-reviews"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2">
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
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-grayScale-50 px-4 py-3">
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

                    <div className="space-y-4">
                      {appRatings.map((rating) => (
                        <div key={rating.id} className="flex gap-3">
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
          </div>
        </>
      )}
    </div>
    </SensitiveRevealProvider>
  )
}
