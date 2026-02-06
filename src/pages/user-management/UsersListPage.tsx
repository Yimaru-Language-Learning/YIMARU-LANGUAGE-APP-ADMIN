import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { cn } from "../../lib/utils"
import { getUsers } from "../../api/users.api"
import { mapUserApiToUser } from "../../types/user.types"
import { useUsersStore } from "../../zustand/userStore"

export function UsersListPage() {
  const navigate = useNavigate()
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

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [toggledStatuses, setToggledStatuses] = useState<Record<number, boolean>>({})
  const [countryFilter, setCountryFilter] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [subscriptionFilter, setSubscriptionFilter] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers(page, pageSize)
        const apiUsers = res.data.data.users

        const mapped = apiUsers.map(mapUserApiToUser)
        setUsers(mapped)
        setTotal(res.data.data.total)

        const initialStatuses: Record<number, boolean> = {}
        mapped.forEach((u) => {
          initialStatuses[u.id] = true
        })
        setToggledStatuses((prev) => ({ ...prev, ...initialStatuses }))
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

  const handlePrev = () => safePage > 1 && setPage(safePage - 1)
  const handleNext = () => safePage < pageCount && setPage(safePage + 1)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map((u) => u.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const allSelected = users.length > 0 && selectedIds.size === users.length

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3, 4)
      if (safePage > 5) {
        pages.push("...")
      }
      if (safePage > 4 && safePage < pageCount - 3) {
        pages.push(safePage)
      }
      if (safePage < pageCount - 4) {
        pages.push("...")
      }
      pages.push(pageCount)
    }
    return pages
  }

  const handleToggle = (id: number) => {
    setToggledStatuses((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleRowClick = (userId: number) => {
    navigate(`/users/${userId}`)
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search by name, phone number"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="h-9 appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Country</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-9 appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Region</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="h-9 appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Subscription</option>
                <option value="Monthly">Monthly</option>
                <option value="Free">Free</option>
                <option value="3-Month">3-Month</option>
                <option value="6-Month">6-Month</option>
                <option value="Expired">Expired</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-grayScale-300 text-brand-600 focus:ring-brand-500"
              />
            </TableHead>
            <TableHead>USER</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-grayScale-400">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => {
              const isActive = toggledStatuses[u.id] ?? false
              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-grayScale-50"
                  onClick={() => handleRowClick(u.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={(e) => handleSelectOne(u.id, e.target.checked)}
                      className="h-4 w-4 rounded border-grayScale-300 text-brand-600 focus:ring-brand-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={undefined} alt={`${u.firstName} ${u.lastName}`} />
                        <AvatarFallback className="bg-grayScale-200 text-grayScale-500">
                          {`${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-grayScale-600">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-grayScale-400">{u.email || u.phoneNumber || "-"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-grayScale-500">{u.phoneNumber || "-"}</TableCell>
                  <TableCell className="text-grayScale-500">{u.country || "-"}</TableCell>
                  <TableCell className="text-grayScale-500">{u.region || "-"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggle(u.id)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                        isActive ? "bg-brand-500" : "bg-grayScale-200"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
                          isActive ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
        <div className="flex items-center gap-2">
          <span>Row Per Page</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
            >
              {[5, 10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
          </div>
          <span>Entries</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={safePage === 1}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md border bg-white text-grayScale-500",
              safePage === 1 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((n, idx) =>
            typeof n === "string" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-grayScale-400">
                ...
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "h-8 w-8 rounded-md border text-sm font-medium",
                  n === safePage
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "bg-white text-grayScale-600 hover:bg-grayScale-50"
                )}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={handleNext}
            disabled={safePage === pageCount}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md border bg-white text-grayScale-500",
              safePage === pageCount && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
