import { useEffect, useState, useCallback } from "react"
import {
  Bell,
  BellOff,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  UserPlus,
  CreditCard,
  BookOpen,
  Video,
  ShieldAlert,
  Loader2,
  MailOpen,
  Mail,
  CheckCheck,
  MailX,
} from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
  markAllUnread,
} from "../../api/notifications.api"
import type { Notification } from "../../types/notification.types"

const PAGE_SIZE = 10

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  announcement: { icon: Megaphone, color: "text-brand-600", bg: "bg-brand-100" },
  system_alert: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
  issue_created: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  issue_status_updated: { icon: CheckCircle2, color: "text-sky-600", bg: "bg-sky-50" },
  course_created: { icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
  course_enrolled: { icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50" },
  sub_course_created: { icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
  video_added: { icon: Video, color: "text-pink-600", bg: "bg-pink-50" },
  user_deleted: { icon: UserPlus, color: "text-red-600", bg: "bg-red-50" },
  admin_created: { icon: UserPlus, color: "text-brand-600", bg: "bg-brand-100" },
  team_member_created: { icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
  subscription_activated: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  payment_verified: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  knowledge_level_update: { icon: Info, color: "text-sky-600", bg: "bg-sky-50" },
  assessment_assigned: { icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
}

const DEFAULT_TYPE_CONFIG = { icon: Bell, color: "text-grayScale-500", bg: "bg-grayScale-100" }

function getLevelBadge(level: string) {
  switch (level) {
    case "error":
    case "critical":
      return "destructive" as const
    case "warning":
      return "warning" as const
    case "success":
      return "success" as const
    case "info":
    default:
      return "info" as const
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function formatTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function NotificationItem({
  notification,
  onToggleRead,
  toggling,
}: {
  notification: Notification
  onToggleRead: (id: string, currentlyRead: boolean) => void
  toggling: boolean
}) {
  const config = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE_CONFIG
  const Icon = config.icon

  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border p-4 transition-all",
        notification.is_read
          ? "border-transparent bg-white hover:bg-grayScale-50"
          : "border-brand-100 bg-brand-50/30 hover:bg-brand-50/50",
      )}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          config.bg,
          config.color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  notification.is_read ? "text-grayScale-600" : "text-grayScale-800",
                )}
              >
                {notification.payload.headline}
              </span>
              <Badge variant={getLevelBadge(notification.level)} className="text-[10px] px-1.5 py-0">
                {notification.level}
              </Badge>
            </div>
            <p
              className={cn(
                "mt-0.5 text-sm leading-relaxed",
                notification.is_read ? "text-grayScale-400" : "text-grayScale-600",
              )}
            >
              {notification.payload.message}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-grayScale-400">
              {formatTimestamp(notification.timestamp)}
            </span>
            <button
              type="button"
              disabled={toggling}
              onClick={() => onToggleRead(notification.id, notification.is_read)}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg transition-colors",
                "opacity-0 group-hover:opacity-100 focus:opacity-100",
                notification.is_read
                  ? "text-grayScale-400 hover:bg-brand-50 hover:text-brand-600"
                  : "text-brand-500 hover:bg-brand-100 hover:text-brand-700",
                toggling && "opacity-50",
              )}
              title={notification.is_read ? "Mark as unread" : "Mark as read"}
            >
              {toggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : notification.is_read ? (
                <Mail className="h-3.5 w-3.5" />
              ) : (
                <MailOpen className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {formatTypeLabel(notification.type)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {notification.delivery_channel}
          </Badge>
          {notification.delivery_status !== "delivered" && notification.delivery_status !== "pending" && (
            <Badge variant="warning" className="text-[10px] px-2 py-0">
              {notification.delivery_status}
            </Badge>
          )}
          {notification.payload.tags && notification.payload.tags.length > 0 && (
            notification.payload.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                {tag}
              </Badge>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [globalUnread, setGlobalUnread] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchData = useCallback(async (currentOffset: number) => {
    setLoading(true)
    setError(false)
    try {
      const [notifRes, unreadRes] = await Promise.all([
        getNotifications(PAGE_SIZE, currentOffset),
        getUnreadCount(),
      ])
      setNotifications(notifRes.data.notifications ?? [])
      setTotalCount(notifRes.data.total_count)
      setGlobalUnread(unreadRes.data.unread)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(offset)
  }, [offset, fetchData])

  const handleToggleRead = useCallback(async (id: string, currentlyRead: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id))
    try {
      if (currentlyRead) {
        await markAsUnread(id)
      } else {
        await markAsRead(id)
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: !currentlyRead } : n)),
      )
      setGlobalUnread((prev) => (currentlyRead ? prev + 1 : Math.max(0, prev - 1)))
    } catch {
      // silently fail — user can retry
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    setBulkLoading(true)
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setGlobalUnread(0)
    } catch {
      // silently fail
    } finally {
      setBulkLoading(false)
    }
  }, [])

  const handleMarkAllUnread = useCallback(async () => {
    setBulkLoading(true)
    try {
      await markAllUnread()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: false })))
      setGlobalUnread(totalCount)
    } catch {
      // silently fail
    } finally {
      setBulkLoading(false)
    }
  }, [totalCount])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-5">
        <div className="mb-1 text-sm font-semibold text-grayScale-500">Notifications</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            {totalCount > 0 && (
              <Badge variant="secondary">{totalCount}</Badge>
            )}
            {globalUnread > 0 && (
              <Badge variant="default">{globalUnread} unread</Badge>
            )}
          </div>

          {/* Bulk actions */}
          {!loading && !error && notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {globalUnread > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkLoading}
                  onClick={handleMarkAllRead}
                >
                  {bulkLoading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 h-3.5 w-3.5" />
                  )}
                  Mark all read
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkLoading}
                  onClick={handleMarkAllUnread}
                >
                  {bulkLoading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MailX className="mr-2 h-3.5 w-3.5" />
                  )}
                  Mark all unread
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <span className="text-sm text-destructive">Failed to load notifications.</span>
            <Button variant="outline" size="sm" onClick={() => fetchData(offset)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-20">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-grayScale-100">
              <BellOff className="h-7 w-7 text-grayScale-400" />
            </div>
            <span className="text-sm font-medium text-grayScale-500">No notifications yet</span>
            <span className="text-xs text-grayScale-400">When you receive notifications, they'll appear here.</span>
          </CardContent>
        </Card>
      )}

      {/* Notification list */}
      {!loading && !error && notifications.length > 0 && (
        <>
          <Card className="shadow-none">
            <CardContent className="divide-y-0 p-2">
              <div className="space-y-1">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onToggleRead={handleToggleRead}
                    toggling={togglingIds.has(n.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-grayScale-400">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-medium text-grayScale-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
