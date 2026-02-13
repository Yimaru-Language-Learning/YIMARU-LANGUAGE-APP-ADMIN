import { Link } from "react-router-dom"
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  ArrowRight,
  List,
  UsersRound,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export function UserManagementDashboard() {
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
              <p className="text-sm font-medium text-grayScale-400">Total Users</p>
              <p className="text-2xl font-bold text-grayScale-600">1,248</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-mint-50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mint-100 text-mint-600">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-grayScale-400">Active Users</p>
              <p className="text-2xl font-bold text-grayScale-600">1,180</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gold-50 shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-grayScale-400">New This Month</p>
              <p className="text-2xl font-bold text-grayScale-600">64</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-grayScale-600">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/users/register" className="group">
            <Card className="h-full border border-grayScale-100 shadow-sm transition-all duration-200 group-hover:border-brand-200 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  Register User
                </CardTitle>
                <CardDescription className="text-sm text-grayScale-400">
                  Add new users to the system with role assignment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                  Get started
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
