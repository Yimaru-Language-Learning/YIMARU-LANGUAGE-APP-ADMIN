import { Eye, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { cn } from "../../lib/utils"
import type { SubscriptionType, User } from "../../stores/usersStore"
import { useUsersStore } from "../../stores/usersStore"

function subscriptionVariant(sub: SubscriptionType) {
  switch (sub) {
    case "Monthly":
      return "warning"
    case "Free":
      return "secondary"
    case "Expired":
      return "destructive"
    case "3-Month":
      return "success"
    case "6-Month":
      return "info"
    default:
      return "default"
  }
}

export function UsersListPage() {
  const [page, setPage] = useState(1)
  const search = useUsersStore((s) => s.search)
  const region = useUsersStore((s) => s.region)
  const subscription = useUsersStore((s) => s.subscription)
  const allUsers = useUsersStore((s) => s.users)
  const setSearch = useUsersStore((s) => s.setSearch)
  const setRegion = useUsersStore((s) => s.setRegion)
  const setSubscription = useUsersStore((s) => s.setSubscription)
  const getFilteredUsers = useUsersStore((s) => s.getFilteredUsers)

  const users = getFilteredUsers()

  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(users.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * pageSize
  const end = safePage * pageSize
  const paged = users.slice(start, end)

  const regions = useMemo(() => Array.from(new Set(allUsers.map((u) => u.region))).sort(), [allUsers])

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>User Management</CardTitle>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search by name, phone number"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={cn(
                "h-10 rounded-lg border bg-white px-3 text-sm font-medium text-grayScale-600",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            >
              <option value="All">Region</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={subscription}
              onChange={(e) => setSubscription(e.target.value as SubscriptionType | "All")}
              className={cn(
                "h-10 rounded-lg border bg-white px-3 text-sm font-medium text-grayScale-600",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            >
              <option value="All">Subscription</option>
              <option value="Monthly">Monthly</option>
              <option value="Free">Free</option>
              <option value="Expired">Expired</option>
              <option value="3-Month">3-Month</option>
              <option value="6-Month">6-Month</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Full Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((u: User) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-grayScale-600">{u.fullName}</TableCell>
                <TableCell className="text-grayScale-500">{u.phone}</TableCell>
                <TableCell className="text-grayScale-500">{u.region}</TableCell>
                <TableCell className="text-grayScale-500">{u.lastActive}</TableCell>
                <TableCell>
                  <Badge variant={subscriptionVariant(u.subscription)}>{u.subscription}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`/users/${u.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-grayScale-500 hover:text-brand-600"
                    aria-label="View user"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-grayScale-500">
          <div className="flex items-center gap-2">
            Row Per Page
            <span className="rounded-md border bg-white px-2 py-1 font-semibold text-grayScale-600">{pageSize}</span>
            Entries
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "h-8 w-8 rounded-md border bg-white text-xs font-semibold text-grayScale-500",
                  n === safePage && "border-brand-200 bg-brand-100/40 text-brand-600",
                )}
              >
                {n}
              </button>
            ))}
            <span className="px-2">…</span>
            <button type="button" className="h-8 w-10 rounded-md border bg-white font-semibold">
              15
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


