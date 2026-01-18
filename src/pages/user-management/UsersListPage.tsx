import { Eye, Search } from "lucide-react"
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { cn } from "../../lib/utils"
import { getUsers } from "../../api/users.api"
import { mapUserApiToUser } from "../../types/user.types"
import { useUsersStore } from "../../zustand/userStore"

type SubscriptionType = "Monthly" | "Free" | "Expired" | "3-Month" | "6-Month" | "N/A"

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
  const {
    users,
    total,
    page,
    pageSize,
    search,
    setUsers,
    setTotal,
    setPage,
    setPageSize,
    setSearch,
  } = useUsersStore()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers(page, pageSize)
        const apiUsers = res.data.data.users

        setUsers(apiUsers.map(mapUserApiToUser))
        setTotal(res.data.data.total)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        setUsers([])
        setTotal(0)
      }
    }

    fetchUsers()
  }, [page, pageSize, setUsers, setTotal])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1)

  const handlePrev = () => safePage > 1 && setPage(safePage - 1)
  const handleNext = () => safePage < pageCount && setPage(safePage + 1)

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>User Management</CardTitle>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search by name or phone number"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Nick Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-grayScale-400">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u, index) => (
                <TableRow key={u.id}>
                  <TableCell className="text-grayScale-500">{(page - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="text-grayScale-600">{u.firstName}</TableCell>
                  <TableCell className="text-grayScale-600">{u.lastName}</TableCell>
                  <TableCell className="text-grayScale-600">{u.nickName}</TableCell>
                  <TableCell className="text-grayScale-500">{u.email}</TableCell>
                  <TableCell className="text-grayScale-500">{u.phoneNumber || "-"}</TableCell>
                  <TableCell className="text-grayScale-500">{u.region}</TableCell>
                  <TableCell className="text-grayScale-500">{u.country}</TableCell>
                  <TableCell className="text-grayScale-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscriptionVariant("N/A")}>N/A</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/users/${u.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-grayScale-500 hover:text-brand-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-grayScale-500">
          <div className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-8 rounded-md border bg-white px-2 text-xs font-semibold text-grayScale-600 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 10, 20, 30].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            of {total}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={safePage === 1}
              className={cn(
                "h-8 w-12 rounded-md border bg-white text-xs font-semibold text-grayScale-500",
                safePage === 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              Prev
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "h-8 w-8 rounded-md border bg-white text-xs font-semibold text-grayScale-500",
                  n === safePage && "border-brand-200 bg-brand-100/40 text-brand-600"
                )}
              >
                {n}
              </button>
            ))}

            <button
              onClick={handleNext}
              disabled={safePage === pageCount}
              className={cn(
                "h-8 w-12 rounded-md border bg-white text-xs font-semibold text-grayScale-500",
                safePage === pageCount && "opacity-50 cursor-not-allowed"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
