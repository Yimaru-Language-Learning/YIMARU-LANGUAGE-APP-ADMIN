import { ChevronDown, ChevronLeft, ChevronRight, Search, Users, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"
import { getUsers, updateUserStatus, type UserStatus } from "../../api/users.api"
import { mapUserApiToUser } from "../../types/user.types"
import { useUsersStore } from "../../zustand/userStore"
import { toast } from "sonner"

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers(
          page,
          pageSize,
          roleFilter || undefined,
          statusFilter || undefined,
          search || undefined,
        )
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
      }
    }

    fetchUsers()
  }, [page, pageSize, roleFilter, statusFilter, search, setUsers, setTotal])

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
      toast.error("Failed to update user status", {
        description: err?.response?.data?.message || "Please try again.",
      })
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-grayScale-600">Users List</h1>
        <p className="text-sm text-grayScale-400">View and manage all registered users.</p>
      </div>

      <div className="bg-white rounded-xl border">
        {/* Search & Filters */}
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
          </div>
        </div>

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
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden md:table-cell">Region</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
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
                    <TableCell className="hidden md:table-cell text-grayScale-500">{u.phoneNumber || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-grayScale-500">{u.country || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-grayScale-500">{u.region || "-"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggle(u.id)}
                        disabled={isUpdatingStatus}
                        className={cn(
                          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1",
                          isActive
                            ? "border-brand-500 bg-brand-500 shadow-[0_6px_16px_rgba(168,85,247,0.35)]"
                            : "border-grayScale-300 bg-grayScale-200 hover:bg-grayScale-300/80",
                          isUpdatingStatus && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-out",
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

        {/* Pagination */}
        <div className="flex flex-col items-center gap-3 border-t px-4 py-3 text-sm text-grayScale-500 sm:flex-row sm:justify-between">
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

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
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
