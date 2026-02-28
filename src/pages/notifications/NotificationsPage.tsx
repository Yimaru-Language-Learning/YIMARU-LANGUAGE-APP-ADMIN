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
  Search,
} from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { FileUpload } from "../../components/ui/file-upload"
import { cn } from "../../lib/utils"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
  markAllUnread,
} from "../../api/notifications.api"
import { getTeamMembers } from "../../api/team.api"
import type { Notification } from "../../types/notification.types"
import type { TeamMember } from "../../types/team.types"

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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [channelFilter, setChannelFilter] = useState<"all" | "push" | "sms">("all")
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "read" | "unread">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all")
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all")

  const [composeChannels, setComposeChannels] = useState<Array<"push" | "sms">>(["push"])
  const [composeAudience, setComposeAudience] = useState<"all" | "selected">("all")
  const [teamRecipients, setTeamRecipients] = useState<TeamMember[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([])
  const [composeTitle, setComposeTitle] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeImage, setComposeImage] = useState<File | null>(null)

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

  const filteredNotifications = notifications.filter((n) => {
    if (channelFilter !== "all" && n.delivery_channel !== channelFilter) return false
    if (activeStatusTab === "read" && !n.is_read) return false
    if (activeStatusTab === "unread" && n.is_read) return false
    if (typeFilter !== "all" && n.type !== typeFilter) return false
    if (levelFilter !== "all" && n.level !== levelFilter) return false
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const haystack = [
        n.payload.headline,
        n.payload.message,
        formatTypeLabel(n.type),
        n.delivery_channel,
        n.level,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification)
    setDetailOpen(true)
  }

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeTitle.trim() || !composeMessage.trim()) return
    if (composeChannels.length === 0) return
    setSending(true)
    try {
      // Hook up to backend send API here when available.
      // For now, we just reset the form after a short delay for UI feedback.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setComposeTitle("")
      setComposeMessage("")
      setComposeAudience("all")
      setComposeChannels(["push"])
      setSelectedRecipientIds([])
      setComposeImage(null)
      setComposeOpen(false)
    } finally {
      setSending(false)
    }
  }

  // Lazy-load users for recipient selection when compose dialog first opens
  useEffect(() => {
    if (!composeOpen || teamRecipients.length > 0 || recipientsLoading) return
    setRecipientsLoading(true)
    getTeamMembers(1, 50)
      .then((res) => {
        setTeamRecipients(res.data.data ?? [])
      })
      .catch(() => {
        setTeamRecipients([])
      })
      .finally(() => {
        setRecipientsLoading(false)
      })
  }, [composeOpen, teamRecipients.length, recipientsLoading])

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-5">
        <div className="mb-1 text-sm font-semibold text-grayScale-500">Notifications</div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            {totalCount > 0 && <Badge variant="secondary">{totalCount}</Badge>}
            {globalUnread > 0 && <Badge variant="default">{globalUnread} unread</Badge>}
          </div>

          {/* Bulk actions */}
          {!loading && !error && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-brand-500 text-white hover:bg-brand-600"
                onClick={() => setComposeOpen(true)}
              >
                <Megaphone className="mr-2 h-3.5 w-3.5" />
                New notification
              </Button>
              {notifications.length > 0 && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-grayScale-500">Total notifications</p>
                <p className="mt-1 text-xl font-semibold text-grayScale-700">
                  {totalCount.toLocaleString()}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
                <Bell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-grayScale-500">Unread</p>
                <p className="mt-1 text-xl font-semibold text-grayScale-700">
                  {globalUnread.toLocaleString()}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <BellOff className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-grayScale-500">Channels used</p>
                <p className="mt-1 text-xl font-semibold text-grayScale-700">
                  {Array.from(new Set(notifications.map((n) => n.delivery_channel))).length || "—"}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-grayScale-50 text-grayScale-500">
                <MailOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <span className="text-xs text-grayScale-400">
              When you receive notifications, they'll appear here.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Filters + table */}
      {!loading && !error && notifications.length > 0 && (
        <>
          {/* Status tabs */}
          <div className="mb-2 border-b border-grayScale-200">
            <div className="-mb-px flex gap-6">
              {(["all", "unread", "read"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveStatusTab(tab)}
                  className={cn(
                    "relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all",
                    activeStatusTab === tab
                      ? "text-brand-600"
                      : "text-grayScale-400 hover:text-grayScale-700",
                  )}
                >
                  {tab === "all" ? "All" : tab === "unread" ? "Unread" : "Read"}
                  {activeStatusTab === tab && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-3 shadow-none">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  placeholder="Search by title, message, or type…"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-grayScale-500">Channel</span>
                  <Select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
                    className="h-8 w-[130px] text-xs"
                  >
                    <option value="all">All</option>
                    <option value="push">Push</option>
                    <option value="sms">SMS</option>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-grayScale-500">Type</span>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 w-[150px] text-xs"
                  >
                    <option value="all">All types</option>
                    {Array.from(new Set(notifications.map((n) => n.type))).map((t) => (
                      <option key={t} value={t}>
                        {formatTypeLabel(t)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-grayScale-500">Level</span>
                  <Select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="h-8 w-[130px] text-xs"
                  >
                    <option value="all">All levels</option>
                    {Array.from(new Set(notifications.map((n) => n.level))).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden lg:table-cell">Message</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-grayScale-400">
                        No notifications match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotifications.map((n) => {
                      const config = TYPE_CONFIG[n.type] ?? DEFAULT_TYPE_CONFIG
                      const Icon = config.icon
                      const isToggling = togglingIds.has(n.id)
                      return (
                        <TableRow
                          key={n.id}
                          className={cn(
                            "cursor-pointer",
                            !n.is_read && "bg-brand-50/40 hover:bg-brand-50/70",
                          )}
                          onClick={() => handleOpenDetail(n)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "grid h-8 w-8 place-items-center rounded-lg text-xs",
                                  config.bg,
                                  config.color,
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-medium text-grayScale-600">
                                {formatTypeLabel(n.type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p
                              className={cn(
                                "max-w-xs truncate text-sm font-medium",
                                n.is_read ? "text-grayScale-600" : "text-grayScale-800",
                              )}
                            >
                              {n.payload.headline}
                            </p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <p className="max-w-sm truncate text-xs text-grayScale-500">
                              {n.payload.message}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {n.delivery_channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getLevelBadge(n.level)}
                              className="text-[10px] uppercase tracking-wide"
                            >
                              {n.is_read ? "Read" : "Unread"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs text-grayScale-400">
                              {formatTimestamp(n.timestamp)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isToggling}
                                onClick={() => handleToggleRead(n.id, n.is_read)}
                                title={n.is_read ? "Mark as unread" : "Mark as read"}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-grayScale-400" />
                                ) : n.is_read ? (
                                  <Mail className="h-3.5 w-3.5 text-grayScale-400" />
                                ) : (
                                  <MailOpen className="h-3.5 w-3.5 text-brand-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleOpenDetail(n)}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
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

      {/* Detail dialog */}
      {selectedNotification && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {(() => {
                    const Icon =
                      (TYPE_CONFIG[selectedNotification.type] ?? DEFAULT_TYPE_CONFIG).icon
                    return <Icon className="h-4 w-4" />
                  })()}
                </span>
                <span className="truncate text-base">
                  {selectedNotification.payload.headline}
                </span>
              </DialogTitle>
              <DialogDescription>
                Sent via {selectedNotification.delivery_channel} ·{" "}
                {formatTimestamp(selectedNotification.timestamp)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-grayScale-50 p-3">
                <p className="text-sm text-grayScale-600">
                  {selectedNotification.payload.message}
                </p>
              </div>

              <div className="grid gap-3 text-xs text-grayScale-500 sm:grid-cols-2">
                <div>
                  <p className="text-grayScale-400">Type</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {formatTypeLabel(selectedNotification.type)}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Level</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {selectedNotification.level}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Channel</p>
                  <p className="mt-0.5 font-medium text-grayScale-700 capitalize">
                    {selectedNotification.delivery_channel}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Delivery status</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {selectedNotification.delivery_status}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-brand-500" />
              <span>Create notification</span>
            </DialogTitle>
            <DialogDescription>
              Send a one-off push or SMS notification to your users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleComposeSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)]">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Channel
                </p>
                <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() =>
                      setComposeChannels((prev) =>
                        prev.includes("push")
                          ? prev.filter((c) => c !== "push")
                          : [...prev, "push"],
                      )
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      composeChannels.includes("push")
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-grayScale-500 hover:text-grayScale-700",
                    )}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Push
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setComposeChannels((prev) =>
                        prev.includes("sms")
                          ? prev.filter((c) => c !== "sms")
                          : [...prev, "sms"],
                      )
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      composeChannels.includes("sms")
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-grayScale-500 hover:text-grayScale-700",
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    SMS
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Audience
                </p>
                <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setComposeAudience("all")}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      composeAudience === "all"
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-grayScale-500 hover:text-grayScale-700",
                    )}
                  >
                    All users
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposeAudience("selected")}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      composeAudience === "selected"
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-grayScale-500 hover:text-grayScale-700",
                    )}
                  >
                    Selected users
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">Title</label>
                  <Input
                    placeholder="Short headline for this notification"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Message
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={
                      composeChannels.includes("sms") && !composeChannels.includes("push")
                        ? "Concise SMS body. Keep it clear and under 160 characters where possible."
                        : "Notification body shown inside the app."
                    }
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="mb-1 block text-xs font-medium text-grayScale-500">
                  Image (push only)
                </p>
                <FileUpload
                  accept="image/*"
                  onFileSelect={setComposeImage}
                  label="Upload notification image"
                  description="Shown with push notification where supported"
                  className="min-h-[110px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
                <p className="text-[10px] text-grayScale-400">
                  Image will be ignored for SMS-only sends. Connect your push provider to attach it
                  to real notifications.
                </p>
              </div>
            </div>

            {composeAudience === "selected" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-grayScale-500">Recipients</p>
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-grayScale-100 bg-grayScale-50/60 p-2">
                  {recipientsLoading && (
                    <div className="flex items-center justify-center py-6 text-xs text-grayScale-400">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading users…
                    </div>
                  )}
                  {!recipientsLoading && teamRecipients.length === 0 && (
                    <div className="py-4 text-center text-xs text-grayScale-400">
                      No users available to select.
                    </div>
                  )}
                  {!recipientsLoading &&
                    teamRecipients.map((member) => (
                      <label
                        key={member.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-grayScale-100"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-grayScale-300"
                          checked={selectedRecipientIds.includes(member.id)}
                          onChange={(e) => {
                            setSelectedRecipientIds((prev) =>
                              e.target.checked
                                ? [...prev, member.id]
                                : prev.filter((id) => id !== member.id),
                            )
                          }}
                        />
                        <span className="truncate">
                          {member.first_name} {member.last_name}
                          <span className="ml-1 text-[10px] text-grayScale-400">
                            · {member.email}
                          </span>
                        </span>
                      </label>
                    ))}
                </div>
                <p className="text-[11px] text-grayScale-400">
                  Only the selected users will receive this notification.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-grayScale-400">
                This is a UI-only preview. Hook into your notification API to deliver messages.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComposeTitle("")
                    setComposeMessage("")
                    setComposeAudience("all")
                    setComposeChannels(["push"])
                    setSelectedRecipientIds([])
                    setComposeImage(null)
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !composeTitle.trim() || !composeMessage.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <MailOpen className="mr-2 h-3.5 w-3.5" />
                      Send notification
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
