import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { getDeletionRequests } from "../../api/users.api"
import { getRoles } from "../../api/rbac.api"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { cn } from "../../lib/utils"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import type {
  DeletionRequest,
  DeletionState,
  DeletionUserStatus,
  GetDeletionRequestsParams,
} from "../../types/user.types"
import type { Role } from "../../types/rbac.types"
import { mapDeletionRequestApiItem } from "../../types/user.types"

const stateBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  DUE: "bg-brand-100 text-brand-600",
  CANCELLED: "bg-grayScale-200 text-grayScale-600",
}

const DATE_PLACEHOLDER = "DD-MM-YYYY HH:mm"
const STATUS_OPTIONS: DeletionUserStatus[] = ["ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"]
const STATE_OPTIONS: DeletionState[] = ["PENDING", "DUE", "CANCELLED"]

type DateTimeFilterInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function DateTimeFilterInput({ value, onChange, placeholder }: DateTimeFilterInputProps) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
      <Input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          // Opens native date-time picker immediately on supported browsers.
          (e.currentTarget as HTMLInputElement).showPicker?.()
        }}
        aria-label={placeholder}
        className="h-11 rounded-xl border-grayScale-200 bg-white pl-10 pr-3 text-sm shadow-sm transition focus-visible:border-brand-400 focus-visible:ring-brand-200 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
      />
    </div>
  )
}

export function DeletionRequestsPage() {
  const [items, setItems] = useState<DeletionRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [query, setQuery] = useState("")
  const [role, setRole] = useState("")
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [roleSearch, setRoleSearch] = useState("")
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [stateMenuOpen, setStateMenuOpen] = useState(false)
  const [status, setStatus] = useState<DeletionUserStatus | "">("")
  const [state, setState] = useState<DeletionState | "">("")
  const [requestedAfter, setRequestedAfter] = useState("")
  const [requestedBefore, setRequestedBefore] = useState("")
  const [scheduledAfter, setScheduledAfter] = useState("")
  const [scheduledBefore, setScheduledBefore] = useState("")
  const roleMenuRef = useRef<HTMLDivElement | null>(null)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const stateMenuRef = useRef<HTMLDivElement | null>(null)

  const toRfc3339 = (value: string) => {
    if (!value) return undefined
    const normalized = value.includes("T") ? value : value.replace(" ", "T")
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: GetDeletionRequestsParams = {
        query: query || undefined,
        role: role || undefined,
        status: status || undefined,
        state: state || undefined,
        requested_after: toRfc3339(requestedAfter),
        requested_before: toRfc3339(requestedBefore),
        scheduled_after: toRfc3339(scheduledAfter),
        scheduled_before: toRfc3339(scheduledBefore),
        page,
        page_size: pageSize,
      }
      const res = await getDeletionRequests(params)
      const rows = res.data?.data?.items ?? []
      setItems(rows.map(mapDeletionRequestApiItem))
      setTotal(res.data?.data?.total ?? 0)
    } catch (error) {
      console.error("Failed to fetch deletion requests:", error)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    query,
    role,
    status,
    state,
    requestedAfter,
    requestedBefore,
    scheduledAfter,
    scheduledBefore,
    page,
    pageSize,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true)
      try {
        const pageSize = 50
        const firstRes = await getRoles({ page: 1, page_size: pageSize })
        const firstBatch = firstRes.data?.data?.roles ?? []
        const total = firstRes.data?.data?.total ?? firstBatch.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))

        let allRoles: Role[] = firstBatch
        if (totalPages > 1) {
          const requests: Array<ReturnType<typeof getRoles>> = []
          for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
            requests.push(getRoles({ page: currentPage, page_size: pageSize }))
          }
          const remaining = await Promise.all(requests)
          allRoles = [...firstBatch, ...remaining.flatMap((r) => r.data?.data?.roles ?? [])]
        }

        const uniqueNames = Array.from(
          new Set(
            allRoles
              .map((r) => r.name?.trim())
              .filter((name): name is string => Boolean(name)),
          ),
        ).sort((a, b) => a.localeCompare(b))
        setRoleOptions(uniqueNames)
      } catch (error) {
        console.error("Failed to fetch role options:", error)
        setRoleOptions([])
      } finally {
        setRolesLoading(false)
      }
    }

    fetchRoles()
  }, [])

  useEffect(() => {
    if (!roleMenuOpen && !statusMenuOpen && !stateMenuOpen) return
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (roleMenuRef.current && !roleMenuRef.current.contains(target)) {
        setRoleMenuOpen(false)
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setStatusMenuOpen(false)
      }
      if (stateMenuRef.current && !stateMenuRef.current.contains(target)) {
        setStateMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [roleMenuOpen, statusMenuOpen, stateMenuOpen])

  const filteredRoleOptions = useMemo(() => {
    const q = roleSearch.trim().toLowerCase()
    if (!q) return roleOptions
    return roleOptions.filter((option) => option.toLowerCase().includes(q))
  }, [roleOptions, roleSearch])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const safePage = Math.min(page, totalPages)
  const startEntry = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, total)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (safePage > 4) pages.push("...")
      if (safePage > 3 && safePage < totalPages - 2) pages.push(safePage)
      if (safePage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const resetFilters = () => {
    setQuery("")
    setRole("")
    setStatus("")
    setState("")
    setRequestedAfter("")
    setRequestedBefore("")
    setScheduledAfter("")
    setScheduledBefore("")
    setRoleSearch("")
    setRoleMenuOpen(false)
    setStatusMenuOpen(false)
    setStateMenuOpen(false)
    setPage(1)
  }

  const activeFilterCount = countActiveFilters([
    { value: role },
    { value: status },
    { value: state },
    { value: requestedAfter },
    { value: requestedBefore },
    { value: scheduledAfter },
    { value: scheduledBefore },
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grayScale-600">Deletion Requests</h1>
        <p className="mt-1 text-sm text-grayScale-400">
          Review and monitor account deletion requests from users.
        </p>
      </div>

      <AdminFiltersPanel
        className="overflow-visible rounded-2xl border border-brand-100/70 shadow-soft"
        activeFilterCount={activeFilterCount}
        onClearFilters={resetFilters}
        clearLabel="Clear filters"
        summary={`${total} request${total === 1 ? "" : "s"}`}
        search={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search name, email, phone..."
              className="h-11 rounded-xl border-grayScale-200 bg-white pl-10 shadow-sm transition focus-visible:border-brand-400 focus-visible:ring-brand-200"
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-xl border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600 shadow-sm transition hover:bg-grayScale-50 focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                onClick={() => {
                  setRoleMenuOpen((prev) => !prev)
                  setStatusMenuOpen(false)
                  setStateMenuOpen(false)
                  if (!roleMenuOpen) setRoleSearch("")
                }}
              >
                <span>{rolesLoading ? "Loading roles..." : role || "Role"}</span>
                <ChevronDown className="h-4 w-4 text-grayScale-400" />
              </button>
              {roleMenuOpen ? (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-grayScale-200 bg-white p-2 shadow-lg">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grayScale-300" />
                    <Input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder="Search role..."
                      className="h-9 rounded-lg border-grayScale-200 pl-8 text-sm"
                    />
                  </div>
                  <div className="max-h-56 space-y-1 overflow-auto">
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-md px-2 py-2 text-left text-sm transition",
                        role === ""
                          ? "bg-brand-100/50 text-brand-700"
                          : "text-grayScale-600 hover:bg-grayScale-100",
                      )}
                      onClick={() => {
                        setRole("")
                        setPage(1)
                        setRoleMenuOpen(false)
                      }}
                    >
                      All Roles
                    </button>
                    {filteredRoleOptions.map((roleName) => (
                      <button
                        key={roleName}
                        type="button"
                        className={cn(
                          "w-full rounded-md px-2 py-2 text-left text-sm transition",
                          role === roleName
                            ? "bg-brand-100/50 text-brand-700"
                            : "text-grayScale-600 hover:bg-grayScale-100",
                        )}
                        onClick={() => {
                          setRole(roleName)
                          setPage(1)
                          setRoleMenuOpen(false)
                        }}
                      >
                        {roleName}
                      </button>
                    ))}
                    {!rolesLoading && filteredRoleOptions.length === 0 ? (
                      <p className="px-2 py-1.5 text-sm text-grayScale-400">No roles found</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-xl border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600 shadow-sm transition hover:bg-grayScale-50 focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                onClick={() => {
                  setStatusMenuOpen((prev) => !prev)
                  setStateMenuOpen(false)
                  setRoleMenuOpen(false)
                }}
              >
                <span>{status || "All Statuses"}</span>
                <ChevronDown className="h-4 w-4 text-grayScale-400" />
              </button>
              {statusMenuOpen ? (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-grayScale-200 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                      status === ""
                        ? "bg-brand-100/50 text-brand-700"
                        : "text-grayScale-600 hover:bg-grayScale-100",
                    )}
                    onClick={() => {
                      setStatus("")
                      setPage(1)
                      setStatusMenuOpen(false)
                    }}
                  >
                    All Statuses
                  </button>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                        status === statusOption
                          ? "bg-brand-100/50 text-brand-700"
                          : "text-grayScale-600 hover:bg-grayScale-100",
                      )}
                      onClick={() => {
                        setStatus(statusOption)
                        setPage(1)
                        setStatusMenuOpen(false)
                      }}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative" ref={stateMenuRef}>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-xl border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600 shadow-sm transition hover:bg-grayScale-50 focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                onClick={() => {
                  setStateMenuOpen((prev) => !prev)
                  setStatusMenuOpen(false)
                  setRoleMenuOpen(false)
                }}
              >
                <span>{state || "All States"}</span>
                <ChevronDown className="h-4 w-4 text-grayScale-400" />
              </button>
              {stateMenuOpen ? (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-grayScale-200 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                      state === ""
                        ? "bg-brand-100/50 text-brand-700"
                        : "text-grayScale-600 hover:bg-grayScale-100",
                    )}
                    onClick={() => {
                      setState("")
                      setPage(1)
                      setStateMenuOpen(false)
                    }}
                  >
                    All States
                  </button>
                  {STATE_OPTIONS.map((stateOption) => (
                    <button
                      key={stateOption}
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                        state === stateOption
                          ? "bg-brand-100/50 text-brand-700"
                          : "text-grayScale-600 hover:bg-grayScale-100",
                      )}
                      onClick={() => {
                        setState(stateOption)
                        setPage(1)
                        setStateMenuOpen(false)
                      }}
                    >
                      {stateOption}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <DateTimeFilterInput
              value={requestedAfter}
              onChange={(value) => {
                setRequestedAfter(value)
                setPage(1)
              }}
              placeholder={`Requested after (${DATE_PLACEHOLDER})`}
            />
            <DateTimeFilterInput
              value={requestedBefore}
              onChange={(value) => {
                setRequestedBefore(value)
                setPage(1)
              }}
              placeholder={`Requested before (${DATE_PLACEHOLDER})`}
            />
            <DateTimeFilterInput
              value={scheduledAfter}
              onChange={(value) => {
                setScheduledAfter(value)
                setPage(1)
              }}
              placeholder={`Scheduled after (${DATE_PLACEHOLDER})`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <DateTimeFilterInput
              value={scheduledBefore}
              onChange={(value) => {
                setScheduledBefore(value)
                setPage(1)
              }}
              placeholder={`Scheduled before (${DATE_PLACEHOLDER})`}
            />
          </div>
      </AdminFiltersPanel>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Requests ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role / Status</TableHead>
                  <TableHead className="hidden md:table-cell">Requested At</TableHead>
                  <TableHead className="hidden md:table-cell">Scheduled At</TableHead>
                  <TableHead>Deletion State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <img src={spinnerSrc} alt="" className="h-6 w-6 animate-spin" />
                        <span className="text-sm text-grayScale-400">Loading requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-8 w-8 text-grayScale-200" />
                        <div>
                          <p className="text-sm font-medium text-grayScale-500">No deletion requests found</p>
                          <p className="mt-1 text-xs text-grayScale-400">Try adjusting your filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={`${item.user_id}-${index}`} className="group">
                      <TableCell className="py-3.5">
                        <p className="text-sm font-medium text-grayScale-700">
                          {item.first_name} {item.last_name}
                        </p>
                        <p className="text-xs text-grayScale-500">{item.email}</p>
                        <p className="text-xs text-grayScale-500">{item.phone_number || "unassigned"}</p>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <p className="text-sm text-grayScale-700">{item.role || "unassigned"}</p>
                        <p className="text-xs text-grayScale-500">{item.status || "unassigned"}</p>
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-600 md:table-cell">
                        {item.deletion_requested_at || "unassigned"}
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-600 md:table-cell">
                        {item.deletion_scheduled_at || "unassigned"}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge className={stateBadge[item.deletion_state] || "bg-grayScale-200 text-grayScale-600"}>
                          {item.deletion_state || "unassigned"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => safePage > 1 && setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    safePage === 1 && "cursor-not-allowed opacity-50",
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
                          : "bg-white text-grayScale-600 hover:bg-grayScale-50",
                      )}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => safePage < totalPages && setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    safePage === totalPages && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
