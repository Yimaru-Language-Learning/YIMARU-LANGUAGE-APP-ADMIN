import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Bell, List, RefreshCw } from "lucide-react"
import { TablePagination } from "../../components/admin/TablePagination"
import { toast } from "sonner"
import { getAllNotifications, resolveNotificationDetail } from "../../api/notifications.api"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { NotificationDetailDialog } from "../../components/notifications/NotificationDetailDialog"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { channelLabel, IN_APP_TYPES } from "../../lib/notificationBulk"
import {
  formatNotificationTimestamp,
  formatNotificationTypeLabel,
  getNotificationLevelBadge,
} from "../../lib/notificationDisplay"
import { cn } from "../../lib/utils"
import {
  DEFAULT_TABLE_PAGE_SIZE,
} from "../../lib/tablePagination"
import { UnassignedLabel } from "../../lib/displayValue"
import { fromDatetimeLocalAppValue } from "../../lib/datetime"
import {
  getNotificationMessage,
  getNotificationTitle,
  hasNotificationContent,
  type Notification,
  type NotificationChannel,
} from "../../types/notification.types"

const CHANNEL_OPTIONS: Array<{ value: "" | NotificationChannel; label: string }> = [
  { value: "", label: "All channels" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "in_app", label: "In-app" },
]

const READ_OPTIONS = [
  { value: "", label: "All read states" },
  { value: "false", label: "Unread only" },
  { value: "true", label: "Read only" },
] as const

function recipientLabel(notification: Notification): string {
  const parts: string[] = []
  if (notification.recipient_id > 0) {
    parts.push(`User #${notification.recipient_id}`)
  }
  if (notification.receiver_type) {
    parts.push(notification.receiver_type)
  }
  if (notification.reciever) {
    parts.push(notification.reciever)
  }
  return parts.length > 0 ? parts.join(" · ") : <UnassignedLabel />
}

export function AllNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rows, setRows] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)

  const [channelFilter, setChannelFilter] = useState<"" | NotificationChannel>("")
  const [typeFilter, setTypeFilter] = useState("")
  const [userIdFilter, setUserIdFilter] = useState("")
  const [readFilter, setReadFilter] = useState<"" | "true" | "false">("")
  const [afterFilter, setAfterFilter] = useState("")
  const [beforeFilter, setBeforeFilter] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  )
  const currentPage = page

  const parsedUserId = useMemo(() => {
    const trimmed = userIdFilter.trim()
    if (!trimmed) return undefined
    const id = Number(trimmed)
    return Number.isFinite(id) && id > 0 ? id : undefined
  }, [userIdFilter])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getAllNotifications({
        page,
        limit: pageSize,
        ...(channelFilter ? { channel: channelFilter } : {}),
        ...(typeFilter.trim() ? { type: typeFilter.trim() } : {}),
        ...(parsedUserId != null ? { user_id: parsedUserId } : {}),
        ...(readFilter === "true" ? { is_read: true } : {}),
        ...(readFilter === "false" ? { is_read: false } : {}),
        ...(fromDatetimeLocalAppValue(afterFilter)
          ? { after: fromDatetimeLocalAppValue(afterFilter) }
          : {}),
        ...(fromDatetimeLocalAppValue(beforeFilter)
          ? { before: fromDatetimeLocalAppValue(beforeFilter) }
          : {}),
      })
      setRows(res.data.notifications)
      setTotalCount(res.data.total_count)
    } catch {
      setError(true)
      setRows([])
      setTotalCount(0)
      notifyApiError(err, "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    channelFilter,
    typeFilter,
    parsedUserId,
    readFilter,
    afterFilter,
    beforeFilter,
  ])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [channelFilter, typeFilter, userIdFilter, readFilter, afterFilter, beforeFilter, pageSize])

  const activeFilterCount = countActiveFilters([
    { value: channelFilter },
    { value: typeFilter },
    { value: userIdFilter },
    { value: readFilter },
    { value: afterFilter },
    { value: beforeFilter },
  ])

  const clearFilters = () => {
    setChannelFilter("")
    setTypeFilter("")
    setUserIdFilter("")
    setReadFilter("")
    setAfterFilter("")
    setBeforeFilter("")
  }

  const openDetail = useCallback(async (notification: Notification) => {
    setDetailLoading(true)
    setDetailError(false)
    setSelectedNotification(notification)
    setDetailOpen(true)

    try {
      const resolved = await resolveNotificationDetail(notification)
      if (!hasNotificationContent(resolved)) {
        setDetailError(true)
        toast.error("Notification not found")
        return
      }
      setSelectedNotification(resolved)
    } catch {
      if (hasNotificationContent(notification)) {
        setSelectedNotification(notification)
      } else {
        setDetailError(true)
        notifyApiError(err, "Failed to load notification details")
      }
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endEntry = Math.min((page - 1) * pageSize + rows.length, totalCount)

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Notifications</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-grayScale-800">
            <List className="h-6 w-6 text-brand-500" />
            All notifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Browse every notification sent across the platform. Filter by channel, type, recipient,
            read state, or date range.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="shrink-0" asChild>
            <Link to="/notifications">My inbox</Link>
          </Button>
          <Button variant="outline" className="shrink-0" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <AdminFiltersPanel
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        summary={
          loading
            ? "Loading…"
            : `${totalCount} notification${totalCount === 1 ? "" : "s"}`
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {IN_APP_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
          >
            {READ_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            min={1}
            placeholder="Recipient user ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />

          <Input
            type="datetime-local"
            value={afterFilter}
            onChange={(e) => setAfterFilter(e.target.value)}
            aria-label="Created after"
          />

          <Input
            type="datetime-local"
            value={beforeFilter}
            onChange={(e) => setBeforeFilter(e.target.value)}
            aria-label="Created before"
          />
        </div>
      </AdminFiltersPanel>

      <Card className="border border-grayScale-100 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-grayScale-500">
              <SpinnerIcon className="mr-2 h-5 w-5" alt="" />
              Loading notifications…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
              Could not load notifications.
              <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-grayScale-300" />
              <p className="text-sm font-medium text-grayScale-600">No notifications found</p>
              <p className="mt-1 text-xs text-grayScale-400">
                Try adjusting your filters or send a notification from the composer.
              </p>
              <Button className="mt-4" size="sm" asChild>
                <Link to="/notifications/create">Send notification</Link>
              </Button>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-grayScale-100">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Title / message</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Level</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead className="hidden sm:table-cell">Delivery</TableHead>
                      <TableHead className="hidden sm:table-cell">Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className="cursor-pointer hover:bg-grayScale-50"
                        onClick={() => void openDetail(notification)}
                      >
                        <TableCell className="max-w-[140px] text-xs text-grayScale-600">
                          <p className="truncate font-medium">{recipientLabel(notification)}</p>
                          <p className="truncate font-mono text-[10px] text-grayScale-400">
                            {notification.id}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate text-sm font-medium text-grayScale-700">
                            {getNotificationTitle(notification) || <UnassignedLabel />}
                          </p>
                          <p className="truncate text-xs text-grayScale-400">
                            {getNotificationMessage(notification) || <UnassignedLabel />}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs capitalize text-grayScale-600">
                          {channelLabel(notification.delivery_channel) || <UnassignedLabel />}
                        </TableCell>
                        <TableCell className="hidden text-xs text-grayScale-600 md:table-cell">
                          {formatNotificationTypeLabel(notification.type)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={getNotificationLevelBadge(notification.level)}
                            className="text-[10px]"
                          >
                            {notification.level || <UnassignedLabel />}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.is_read ? "secondary" : "default"}>
                            {notification.is_read ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs capitalize text-grayScale-500 sm:table-cell">
                          {notification.delivery_status || <UnassignedLabel />}
                        </TableCell>
                        <TableCell className="hidden text-xs text-grayScale-500 sm:table-cell">
                          {formatNotificationTimestamp(notification.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        {!loading && !error && totalCount > 0 && (
          <TablePagination
            startEntry={startEntry}
            endEntry={endEntry}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        )}
      </Card>

      <NotificationDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        notification={selectedNotification}
        loading={detailLoading}
        error={detailError}
        onRetry={
          selectedNotification
            ? () => void openDetail(selectedNotification)
            : undefined
        }
      />
    </div>
  )
}
