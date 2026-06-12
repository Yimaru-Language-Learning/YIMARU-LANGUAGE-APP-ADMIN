import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  cancelScheduledNotification,
  getScheduledNotifications,
} from "../../api/notifications.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
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
import {
  channelLabel,
  formatScheduledAtLabel,
  scheduledStatusBadgeVariant,
} from "../../lib/notificationBulk"
import { cn } from "../../lib/utils"
import { DEFAULT_TABLE_PAGE_SIZE } from "../../lib/tablePagination"
import type {
  NotificationChannel,
  ScheduledNotification,
  ScheduledNotificationStatus,
} from "../../types/notification.types"

const STATUS_OPTIONS: Array<{ value: "" | ScheduledNotificationStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

const CHANNEL_OPTIONS: Array<{ value: "" | NotificationChannel; label: string }> = [
  { value: "", label: "All channels" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "in_app", label: "In-app" },
]

export function ScheduledNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rows, setRows] = useState<ScheduledNotification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState<"" | ScheduledNotificationStatus>("")
  const [channelFilter, setChannelFilter] = useState<"" | NotificationChannel>("")
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / limit)),
    [totalCount, limit],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getScheduledNotifications({
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(channelFilter ? { channel: channelFilter } : {}),
      })
      setRows(res.data.scheduled_notifications)
      setTotalCount(res.data.total_count)
    } catch {
      setError(true)
      setRows([])
      setTotalCount(0)
      toast.error("Failed to load scheduled notifications")
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, channelFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, channelFilter])

  const handleCancel = async (job: ScheduledNotification) => {
    if (job.status !== "pending" && job.status !== "processing") return
    try {
      setCancellingId(job.id)
      await cancelScheduledNotification(job.id)
      toast.success("Scheduled notification cancelled", {
        description: `Job #${job.id} was cancelled.`,
      })
      await load()
    } catch {
      toast.error("Failed to cancel scheduled notification")
    } finally {
      setCancellingId(null)
    }
  }

  const targetingSummary = (job: ScheduledNotification) => {
    if (job.target_role) return `Role: ${job.target_role}`
    if (job.target_user_ids?.length) {
      return `${job.target_user_ids.length} user(s)`
    }
    if (job.target_raw?.phones?.length) {
      return `${job.target_raw.phones.length} phone(s)`
    }
    if (job.target_raw?.emails?.length) {
      return `${job.target_raw.emails.length} email(s)`
    }
    return "—"
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Notifications</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-grayScale-800">
            <CalendarClock className="h-6 w-6 text-brand-500" />
            Scheduled notifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            View pending and completed bulk notification jobs. Cancel jobs before they are sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="shrink-0 bg-brand-500 text-white hover:bg-brand-600" asChild>
            <Link to="/notifications/create">
              <Plus className="mr-2 h-4 w-4" />
              Send notification
            </Link>
          </Button>
          <Button variant="outline" className="shrink-0" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-grayScale-100 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="sm:max-w-[180px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
              className="sm:max-w-[180px]"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Badge variant="secondary" className="w-fit">
              {totalCount} job{totalCount === 1 ? "" : "s"}
            </Badge>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-grayScale-500">
              <SpinnerIcon className="mr-2 h-5 w-5" alt="" />
              Loading scheduled jobs…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
              Could not load scheduled notifications.
              <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16 text-center">
              <Megaphone className="mx-auto mb-3 h-8 w-8 text-grayScale-300" />
              <p className="text-sm font-medium text-grayScale-600">No scheduled jobs found</p>
              <p className="mt-1 text-xs text-grayScale-400">
                Schedule a notification from the composer to see it here.
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
                      <TableHead>ID</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Title / message</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">#{job.id}</TableCell>
                        <TableCell>{channelLabel(job.channel)}</TableCell>
                        <TableCell className="max-w-[240px]">
                          <p className="truncate text-sm font-medium text-grayScale-700">
                            {job.title || "—"}
                          </p>
                          <p className="truncate text-xs text-grayScale-400">{job.message}</p>
                        </TableCell>
                        <TableCell className="text-xs text-grayScale-500">
                          {targetingSummary(job)}
                        </TableCell>
                        <TableCell className="text-xs text-grayScale-500">
                          {formatScheduledAtLabel(job.scheduled_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={scheduledStatusBadgeVariant(job.status)}>
                            {job.status}
                          </Badge>
                          {job.last_error && job.status === "failed" && (
                            <p className="mt-1 max-w-[180px] truncate text-[10px] text-destructive">
                              {job.last_error}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(job.status === "pending" || job.status === "processing") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancellingId === job.id}
                              onClick={() => void handleCancel(job)}
                            >
                              {cancellingId === job.id ? (
                                <SpinnerIcon className="mr-1 h-3.5 w-3.5" alt="" />
                              ) : (
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                              )}
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-grayScale-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
