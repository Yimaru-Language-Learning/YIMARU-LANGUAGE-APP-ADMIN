import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  UserX,
  UserCheck,
  TrendingUp,
  ArrowRight,
  List,
  UsersRound,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { getDashboard } from "../../api/analytics.api"
import type { DashboardUsers } from "../../types/analytics.types"

export function UserManagementDashboard() {
  const [stats, setStats] = useState<DashboardUsers | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboard()
        const usersData = (res.data as any)?.users ?? (res.data as any)?.data?.users ?? null
        setStats(usersData)
      } catch {
        // silently fail — cards will show "—"
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatNum = (n: number) => n.toLocaleString()
  const activeUsers =
    stats?.by_status?.find((item) => item.label?.toUpperCase() === "ACTIVE")?.count ?? null

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-grayScale-600">User Management</h1>
        <p className="mt-1 text-sm text-grayScale-400">
          Manage users, groups, and registrations.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none bg-brand-50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">Total Users</p>
              <p className="text-2xl font-bold text-white">
                {statsLoading ? <SpinnerIcon className="h-5 w-5" /> : stats ? formatNum(stats.total_users) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-brand-50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {statsLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : activeUsers !== null ? (
                  formatNum(activeUsers)
                ) : (
                  "—"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-brand-50 shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">New This Month</p>
              <p className="text-2xl font-bold text-white">
                {statsLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : stats ? (
                  formatNum(stats.new_month)
                ) : (
                  "—"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-grayScale-600">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/users/deletion-requests" className="group">
            <Card className="h-full border border-grayScale-100 shadow-sm transition-all duration-200 group-hover:border-brand-200 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <UserX className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  Deletion Requests
                </CardTitle>
                <CardDescription className="text-sm text-grayScale-400">
                  Review account deletion requests and user deletion states.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                  View requests
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/users/groups" className="group">
            <Card className="h-full border border-grayScale-100 shadow-sm transition-all duration-200 group-hover:border-brand-200 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <UsersRound className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  User Groups
                </CardTitle>
                <CardDescription className="text-sm text-grayScale-400">
                  Manage groups, roles, and permission settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                  Manage groups
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/users/list" className="group sm:col-span-2 lg:col-span-1">
            <Card className="h-full border border-grayScale-100 shadow-sm transition-all duration-200 group-hover:border-brand-200 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <List className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  User List
                </CardTitle>
                <CardDescription className="text-sm text-grayScale-400">
                  Browse, search, and manage all registered users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                  View all users
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
