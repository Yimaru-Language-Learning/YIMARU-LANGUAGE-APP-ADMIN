// import type { UserProfileResponse } from "../types/user.types";
import {
  Activity,
  BadgeCheck,
  Coins,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react"
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
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { cn } from "../lib/utils"
import { getUserById } from "../api/users.api"
import type { UserProfileResponse } from "../types/user.types"
import { useEffect, useState } from "react"

const userGrowth = [
  { month: "Jan", users: 2400 },
  { month: "Feb", users: 2700 },
  { month: "Mar", users: 3100 },
  { month: "Apr", users: 1900 },
  { month: "May", users: 1900 },
  { month: "Jun", users: 2100 },
  { month: "Jul", users: 2050 },
  { month: "Aug", users: 2900 },
  { month: "Sep", users: 2000 },
  { month: "Oct", users: 2050 },
  { month: "Nov", users: 1850 },
  { month: "Dec", users: 1900 },
]

const subscriptionStatus = [
  { name: "Free Plan", value: 3125, color: "#9E2891" },
  { name: "Monthly Plan", value: 5901, color: "#FFD23F" },
  { name: "3-Month Plan", value: 1203, color: "#1DE9B6" },
  { name: "6-Monthly Plan", value: 825, color: "#C26FC0" },
]

const revenueTrend = [
  { month: "Jan", value: 52000 },
  { month: "Feb", value: 30000 },
  { month: "Mar", value: 50000 },
  { month: "Apr", value: 28000 },
  { month: "May", value: 70000 },
  { month: "Jun", value: 76000 },
]

const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y"] as const

export function DashboardPage() {
  const [userFirstName, setUserFirstName] = useState<string>("")
  const activeRange = "1Y"

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = Number(localStorage.getItem("user_id"))
        const res = await getUserById(userId)
        const userProfile: UserProfileResponse = res.data

        setUserFirstName(userProfile.data.first_name)
        localStorage.setItem("user_first_name", userProfile.data.first_name)
        localStorage.setItem("user_last_name", userProfile.data.last_name)
      } catch (err) {
        console.error(err)
      }
    }

    fetchUser()
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-2 text-sm font-semibold text-grayScale-500">Dashboard</div>
      <div className="mb-5 text-2xl font-semibold tracking-tight">
        Welcome, {userFirstName || localStorage.getItem("user_first_name")}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value="12,490"
          deltaLabel="-15%"
          deltaPositive={false}
        />
        <StatCard
          icon={BadgeCheck}
          label="Active Subscribers"
          value="3,200"
          deltaLabel="+35%"
          deltaPositive
        />
        <StatCard
          icon={Activity}
          label="Monthly Active Users"
          value="521"
          deltaLabel="+41%"
          deltaPositive
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue (ETB)"
          value="927,004"
          deltaLabel="-20%"
          deltaPositive={false}
        />
        <StatCard
          icon={Coins}
          label="Monthly Revenue (ETB)"
          value="81,290"
          deltaLabel="+35%"
          deltaPositive
        />
        <StatCard
          icon={TrendingUp}
          label="Growth Rate"
          value="12.5%"
          deltaLabel="+5%"
          deltaPositive
        />
      </div>

      <div className="mt-5 grid gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>User Growth</CardTitle>
                <div className="mt-1 text-2xl font-semibold tracking-tight">5,730</div>
                <div className="text-xs font-medium text-mint-500">Last 12 Months +15.2%</div>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-grayScale-100 p-1">
                {ranges.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold text-grayScale-500",
                      r === activeRange && "bg-brand-500 text-white",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] p-6 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9E2891" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#9E2891" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E0E0E0",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#9E2891"
                  strokeWidth={2}
                  fill="url(#fillBrand)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Status</CardTitle>
                <div className="rounded-full bg-grayScale-100 px-3 py-1 text-xs font-semibold text-grayScale-500">
                  Weekly
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 pt-2 md:grid-cols-2">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {subscriptionStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
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
                {subscriptionStatus.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-grayScale-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-grayScale-600">{s.value.toLocaleString()} Users</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Trend</CardTitle>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">ETB 923,417</div>
                  <div className="text-xs font-medium text-grayScale-500">Last 6 Months (ETB)</div>
                </div>
                <Button variant="ghost" className="text-brand-600 hover:text-brand-600">
                  View Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[220px] p-6 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString()}`, "ETB"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E0E0E0",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#9E2891" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


