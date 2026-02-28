import {
  // Activity,
  BadgeCheck,
  BookOpen,
  // Coins,
  DollarSign,
  HelpCircle,
  TicketCheck,
  // TrendingUp,
  Users,
  Bell,
  UsersRound,
} from "lucide-react"
import spinnerSrc from "../assets/Circular-indeterminate progress indicator.svg"
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
import { StatCard } from "../components/dashboard/StatCard"
import alertSrc from "../assets/Alert.svg"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { cn } from "../lib/utils"
import { getTeamMemberById } from "../api/team.api"
import { getDashboard } from "../api/analytics.api"
import { useEffect, useState } from "react"
import type { DashboardData } from "../types/analytics.types"

const PIE_COLORS = ["#9E2891", "#FFD23F", "#1DE9B6", "#C26FC0", "#6366F1", "#F97316", "#14B8A6", "#EF4444"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function DashboardPage() {
  const [userFirstName, setUserFirstName] = useState<string>("")
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStatTab, setActiveStatTab] = useState<"primary" | "secondary">("primary")

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

    const fetchDashboard = async () => {
      try {
        const res = await getDashboard()
        setDashboard(res.data as unknown as DashboardData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
    fetchDashboard()
  }, [])

  const registrationData =
    dashboard?.users.registrations_last_30_days.map((d) => ({
      date: formatDate(d.date),
      count: d.count,
    })) ?? []

  const revenueData =
    dashboard?.payments.revenue_last_30_days.map((d) => ({
      date: formatDate(d.date),
      revenue: d.revenue,
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-2 text-sm font-semibold text-grayScale-500">Dashboard</div>
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
                icon={BadgeCheck}
                label="Active Subscribers"
                value={dashboard.subscriptions.active_subscriptions.toLocaleString()}
                deltaLabel={`+${dashboard.subscriptions.new_month} this month`}
                deltaPositive={dashboard.subscriptions.new_month > 0}
              />
              <StatCard
                icon={DollarSign}
                label="Total Revenue (ETB)"
                value={dashboard.payments.total_revenue.toLocaleString()}
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
          {activeStatTab === "secondary" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={BookOpen}
                label="Courses"
                value={dashboard.courses.total_courses.toLocaleString()}
                deltaLabel={`${dashboard.courses.total_sub_courses} sub-courses, ${dashboard.courses.total_videos} videos`}
                deltaPositive
              />
              <StatCard
                icon={HelpCircle}
                label="Questions"
                value={dashboard.content.total_questions.toLocaleString()}
                deltaLabel={`${dashboard.content.total_question_sets} question sets`}
                deltaPositive
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
                    Last 30 Days
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

              {/* Revenue Chart */}
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Revenue Trend</CardTitle>
                      <div className="mt-2 text-2xl font-semibold tracking-tight">
                        ETB {dashboard.payments.total_revenue.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-grayScale-500">Last 30 Days (ETB)</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[220px] p-6 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toLocaleString()}`, "ETB"]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E0E0E0",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#9E2891" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role / Region / Knowledge Level */}
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: "Users by Role", data: dashboard.users.by_role },
                { title: "Users by Region", data: dashboard.users.by_region },
                { title: "Users by Knowledge Level", data: dashboard.users.by_knowledge_level },
              ].map(({ title, data }) => (
                <Card key={title} className="shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    {data.length > 0 ? (
                      <div className="space-y-3">
                        {data.map((item, i) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                              />
                              <span className="text-grayScale-600">{item.label}</span>
                            </div>
                            <span className="font-semibold text-grayScale-600">{item.count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 text-sm text-grayScale-400">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
