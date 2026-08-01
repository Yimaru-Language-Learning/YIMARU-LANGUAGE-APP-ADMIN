import { notifyApiError } from "../../lib/apiErrors"
import { ChevronDown, ChevronLeft, ChevronRight, Search, TrendingUp, UserCheck, Users, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { ExportCsvButton } from "../../components/export/ExportCsvButton"
import { ExportTruncationWarning } from "../../components/export/ExportTruncationWarning"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { ToggleSwitch } from "../../components/ui/toggle-switch"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { cn } from "../../lib/utils"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { getDashboard } from "../../api/analytics.api"
import { getUsers, updateUserStatus, type UserStatus } from "../../api/users.api"
import type { DashboardUsers } from "../../types/analytics.types"
import { mapUserApiToUser } from "../../types/user.types"
import { useUsersStore } from "../../zustand/userStore"
import { toast } from "sonner"
import axios from "axios"
import { USER_FILTER_COUNTRIES, USER_FILTER_ETHIOPIA_REGIONS } from "../../data/userFilterLocations"
import { EXPORT_PERMISSIONS, EXPORT_ROUTES } from "../../lib/csv-export"
import { usersExportQuery } from "../../lib/csvExportFilters"

function formatJoinedAt(iso: string): string {
  if (!iso?.trim()) return "unassigned"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "unassigned"
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

/** Convert `<input type="datetime-local" />` value to RFC3339 for GET /users. */
function toRfc3339FromDatetimeLocal(value: string): string | undefined {
  const t = value?.trim()
  if (!t) return undefined
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

/** Portaled menu — native `<select>` lists break inside `overflow-y-auto` shells (e.g. app main). */
function UserListFilterDropdown({
  id,
  label,
  value,
  allLabel,
  options,
  onSelect,
}: {
  id: string
  label: string
  value: string
  allLabel: string
  options: readonly string[]
  onSelect: (next: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-grayScale-500">
        {label}
      </label>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            id={id}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600",
              "outline-none focus-visible:ring-1 focus-visible:ring-brand-500",
            )}
          >
            <span className="min-w-0 truncate">{value || allLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-400" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="z-[200] max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-md border border-grayScale-200 bg-white p-1 shadow-lg"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenu.Item
              className={cn(
                "cursor-pointer rounded px-2 py-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100",
                !value && "bg-grayScale-50 font-medium",
              )}
              onSelect={() => onSelect("")}
            >
              {allLabel}
            </DropdownMenu.Item>
            {options.map((opt) => (
              <DropdownMenu.Item
                key={opt}
                className={cn(
                  "cursor-pointer rounded px-2 py-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100",
                  value === opt && "bg-brand-50 font-medium text-brand-700",
                )}
                onSelect={() => onSelect(opt)}
              >
                {opt}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

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
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<number>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    id: number
    name: string
    nextStatus: UserStatus
  } | null>(null)
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [createdAfterLocal, setCreatedAfterLocal] = useState("")
  const [createdBeforeLocal, setCreatedBeforeLocal] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [userSummary, setUserSummary] = useState<DashboardUsers | null>(null)
  const [userSummaryLoading, setUserSummaryLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDashboard()
        setUserSummary(res.data.users ?? null)
      } catch {
        setUserSummary(null)
      } finally {
        setUserSummaryLoading(false)
      }
    }
    fetchSummary()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await getUsers({
          page,
          page_size: pageSize,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          query: search || undefined,
          created_after: toRfc3339FromDatetimeLocal(createdAfterLocal),
          created_before: toRfc3339FromDatetimeLocal(createdBeforeLocal),
          country: countryFilter.trim() || undefined,
          region: regionFilter.trim() || undefined,
          subscription_status: subscriptionStatusFilter || undefined,
        })
        const apiUsers = res.data.data.users

        const mapped = apiUsers.map(mapUserApiToUser)
        setUsers(mapped)
        setTotal(res.data.data.total)

        const initialStatuses: Record<number, boolean> = {}
        mapped.forEach((u) => {
          initialStatuses[u.id] = u.status === "ACTIVE"
        })
        setToggledStatuses((prev) => ({ ...prev, ...initialStatuses }))
      } catch (error) {
        console.error("Failed to fetch users:", error)
        setUsers([])
        setTotal(0)
        const msg = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined
        toast.error(typeof msg === "string" && msg.trim() ? msg : "Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [
    page,
    pageSize,
    roleFilter,
    statusFilter,
    search,
    createdAfterLocal,
    createdBeforeLocal,
    countryFilter,
    regionFilter,
    subscriptionStatusFilter,
    setUsers,
    setTotal,
  ])

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
  const startEntry = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, total)

  const formatSummaryNum = (n: number) => n.toLocaleString()
  const activeUsersTotal =
    userSummary?.by_status?.find((item) => item.label?.toUpperCase() === "ACTIVE")?.count ?? null

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
    if (updatingStatusIds.has(id)) return
    const user = users.find((u) => u.id === id)
    if (!user) return

    const isCurrentlyActive = toggledStatuses[id] ?? false
    const nextStatus: UserStatus = isCurrentlyActive ? "DEACTIVATED" : "ACTIVE"
    setConfirmDialog({
      id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      nextStatus,
    })
  }

  const handleConfirmStatusUpdate = async () => {
    if (!confirmDialog) return
    const { id, nextStatus } = confirmDialog
    const nextActive = nextStatus === "ACTIVE"
    const previousActive = toggledStatuses[id] ?? false

    setToggledStatuses((prev) => ({ ...prev, [id]: nextActive }))
    setUpdatingStatusIds((prev) => new Set(prev).add(id))
    try {
      await updateUserStatus({ user_id: id, status: nextStatus })
      setUsers(
        users.map((user) => (user.id === id ? { ...user, status: nextStatus } : user)),
      )
      toast.success(`User ${nextActive ? "activated" : "deactivated"} successfully`)
    } catch (err: any) {
      setToggledStatuses((prev) => ({ ...prev, [id]: previousActive }))
      notifyApiError(err, "Failed to update user status")
    } finally {
      setUpdatingStatusIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setConfirmDialog(null)
    }
  }

  const handleRowClick = (userId: number) => {
    navigate(`/users/${userId}`)
  }

  const activeFilterCount = countActiveFilters([
    { value: roleFilter },
    { value: statusFilter },
    { value: createdAfterLocal },
    { value: createdBeforeLocal },
    { value: countryFilter },
    { value: regionFilter },
    { value: subscriptionStatusFilter },
  ])

  const clearFilters = () => {
    setRoleFilter("")
    setStatusFilter("")
    setCreatedAfterLocal("")
    setCreatedBeforeLocal("")
    setCountryFilter("")
    setRegionFilter("")
    setSubscriptionStatusFilter("")
    setPage(1)
  }

  const exportParams = useMemo(
    () =>
      usersExportQuery({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        query: search || undefined,
        created_after: toRfc3339FromDatetimeLocal(createdAfterLocal),
        created_before: toRfc3339FromDatetimeLocal(createdBeforeLocal),
        country: countryFilter.trim() || undefined,
        region: regionFilter.trim() || undefined,
        subscription_status: subscriptionStatusFilter || undefined,
      }),
    [
      roleFilter,
      statusFilter,
      search,
      createdAfterLocal,
      createdBeforeLocal,
      countryFilter,
      regionFilter,
      subscriptionStatusFilter,
    ],
  )

  const renderContactDetails = (phone: string | undefined, email: string | undefined) => {
    const hasPhone = Boolean(phone?.trim())
    const hasEmail = Boolean(email?.trim())
    if (!hasPhone && !hasEmail) {
      return <span className="text-grayScale-400">unassigned</span>
    }
    return (
      <div className="space-y-1 text-sm text-grayScale-600">
        {hasPhone ? <div className="tabular-nums">{phone!.trim()}</div> : null}
        {hasEmail ? <div className="break-all text-grayScale-500">{email!.trim()}</div> : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">Users List</h1>
          <p className="text-sm text-grayScale-400">View and manage all registered users.</p>
        </div>
        <ExportCsvButton
          permission={EXPORT_PERMISSIONS.users}
          exportPath={EXPORT_ROUTES.users}
          params={exportParams}
          disabled={loading}
        />
      </div>

      {/* Platform-wide user summary (same metrics as former User Management dashboard) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-grayScale-500">Total Users</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {userSummaryLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : userSummary ? (
                  formatSummaryNum(userSummary.total_users)
                ) : (
                  "unassigned"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-grayScale-500">Active Users</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {userSummaryLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : activeUsersTotal !== null ? (
                  formatSummaryNum(activeUsersTotal)
                ) : (
                  "unassigned"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-grayScale-500">New This Month</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {userSummaryLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : userSummary ? (
                  formatSummaryNum(userSummary.new_month)
                ) : (
                  "unassigned"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 overflow-hidden bg-white rounded-xl border">
        <div className="px-4 pt-4">
          <ExportTruncationWarning totalCount={total} />
        </div>
        <AdminFiltersPanel
          className="border-0 border-b rounded-none shadow-none"
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          footer="Dates are sent as RFC3339 (UTC). Country and region filters use the lists above; the API matches case-insensitively."
          search={
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
              <Input
                placeholder="Search by name, phone number"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        >
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 w-full sm:w-auto appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All roles</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 w-full sm:w-auto appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-created-after" className="text-xs font-medium text-grayScale-500">
                Created on or after
              </label>
              <input
                id="filter-created-after"
                type="datetime-local"
                value={createdAfterLocal}
                onChange={(e) => {
                  setCreatedAfterLocal(e.target.value)
                  setPage(1)
                }}
                className="h-9 w-full rounded-md border border-grayScale-200 bg-white px-2 text-sm text-grayScale-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-created-before" className="text-xs font-medium text-grayScale-500">
                Created on or before
              </label>
              <input
                id="filter-created-before"
                type="datetime-local"
                value={createdBeforeLocal}
                onChange={(e) => {
                  setCreatedBeforeLocal(e.target.value)
                  setPage(1)
                }}
                className="h-9 w-full rounded-md border border-grayScale-200 bg-white px-2 text-sm text-grayScale-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <UserListFilterDropdown
              id="filter-country"
              label="Country"
              value={countryFilter}
              allLabel="All countries"
              options={USER_FILTER_COUNTRIES}
              onSelect={(next) => {
                setCountryFilter(next)
                setPage(1)
              }}
            />
            <UserListFilterDropdown
              id="filter-region"
              label="Region (Ethiopia)"
              value={regionFilter}
              allLabel="All regions"
              options={USER_FILTER_ETHIOPIA_REGIONS}
              onSelect={(next) => {
                setRegionFilter(next)
                setPage(1)
              }}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-subscription-status" className="text-xs font-medium text-grayScale-500">
                Subscription status
              </label>
              <div className="relative w-full">
                <select
                  id="filter-subscription-status"
                  value={subscriptionStatusFilter}
                  onChange={(e) => {
                    setSubscriptionStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 w-full appearance-none rounded-md border border-grayScale-200 bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="Unsubscribed">Unsubscribed</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
              </div>
            </div>
          </div>
        </AdminFiltersPanel>

        {/* Table */}
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
              <TableHead className="hidden md:table-cell min-w-[10rem]">Contact details</TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden md:table-cell">Region</TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">Joined at</TableHead>
              <TableHead className="hidden lg:table-cell max-w-[12rem]">Subscription status</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <p className="text-sm text-grayScale-400">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-grayScale-100">
                      <Users className="h-7 w-7 text-grayScale-400" />
                    </div>
                    <div>
                      <p className="font-medium text-grayScale-500">No users found</p>
                      <p className="text-sm text-grayScale-400">Try adjusting your search or filters.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isActive = toggledStatuses[u.id] ?? false
                const isUpdatingStatus = updatingStatusIds.has(u.id)
                return (
                  <TableRow
                    key={u.id}
                    className="group cursor-pointer"
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
                        <div className="font-medium text-grayScale-600">
                          {u.firstName} {u.lastName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-top">
                      {renderContactDetails(u.phoneNumber, u.email)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-grayScale-500">{u.country || "unassigned"}</TableCell>
                    <TableCell className="hidden md:table-cell text-grayScale-500">{u.region || "unassigned"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-grayScale-500 whitespace-nowrap">
                      {formatJoinedAt(u.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell align-top text-sm text-grayScale-600">
                      <span
                        className={cn(
                          u.subscriptionStatus === "unassigned" ||
                            u.subscriptionStatus.toLowerCase() === "unsubscribed"
                            ? "text-grayScale-400"
                            : undefined,
                        )}
                      >
                        {u.subscriptionStatus}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ToggleSwitch
                        checked={isActive}
                        disabled={isUpdatingStatus}
                        onCheckedChange={() => handleToggle(u.id)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-medium text-grayScale-600">
              {startEntry}-{endEntry}
            </span>
            <span>of</span>
            <span className="font-medium text-grayScale-600">{total}</span>
            <span className="mr-4">entries</span>
            <span className="border-l pl-4">Rows per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
              >
                {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>
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

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Confirm Status Change</h2>
              <button
                onClick={() => setConfirmDialog(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold">{confirmDialog.name || "this user"}</span> to{" "}
                <span className="font-semibold capitalize">{confirmDialog.nextStatus.toLowerCase()}</span>?
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                className="bg-brand-600 text-white hover:bg-brand-500"
                onClick={handleConfirmStatusUpdate}
                disabled={updatingStatusIds.has(confirmDialog.id)}
              >
                {updatingStatusIds.has(confirmDialog.id) ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
