import { useEffect, useState, useCallback, useMemo } from "react"
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
  MailOpen,
  Mail,
  CheckCheck,
  MailX,
  Search,
  ChevronDown,
  Calendar,
  Clock3,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { FileUpload } from "../../components/ui/file-upload"
import { cn } from "../../lib/utils"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
  markAllUnread,
  sendBulkSms,
  sendBulkEmail,
  sendBulkPush,
} from "../../api/notifications.api"
import { getRoles } from "../../api/rbac.api"
import { getTeamMembers } from "../../api/team.api"
import { getUsers } from "../../api/users.api"
import { getNotificationMessage, getNotificationTitle, type Notification } from "../../types/notification.types"
import type { Role } from "../../types/rbac.types"
import type { TeamMember } from "../../types/team.types"
import type { UserApiDTO } from "../../types/user.types"
import { toast } from "sonner"

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

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
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
                {getNotificationTitle(notification)}
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
              {getNotificationMessage(notification)}
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
                <SpinnerIcon className="h-3.5 w-3.5" />
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

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkChannel, setBulkChannel] = useState<"sms" | "email" | "push">("sms")
  const [bulkTitle, setBulkTitle] = useState("")
  const [bulkMessage, setBulkMessage] = useState("")
  const [bulkRole, setBulkRole] = useState("")
  const [bulkUserIds, setBulkUserIds] = useState<number[]>([])
  const [bulkScheduledAt, setBulkScheduledAt] = useState("")
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkRoles, setBulkRoles] = useState<Role[]>([])
  const [bulkUsers, setBulkUsers] = useState<UserApiDTO[]>([])
  const [bulkRolesLoading, setBulkRolesLoading] = useState(false)
  const [bulkUsersLoading, setBulkUsersLoading] = useState(false)
  const [scheduleMenuOpen, setScheduleMenuOpen] = useState(false)
  const [scheduleYear, setScheduleYear] = useState("")
  const [scheduleMonth, setScheduleMonth] = useState("")
  const [scheduleDay, setScheduleDay] = useState("")
  const [scheduleHour, setScheduleHour] = useState("")
  const [scheduleMinute, setScheduleMinute] = useState("")

  const filteredBulkUsers = useMemo(() => {
    if (!bulkRole.trim()) return bulkUsers
    const selectedRole = bulkRole.trim().toLowerCase()
    return bulkUsers.filter((user) => user.role?.toLowerCase() === selectedRole)
  }, [bulkUsers, bulkRole])

  const scheduledAtLabel = useMemo(() => {
    if (!bulkScheduledAt) return "Set date & time"
    const parsed = new Date(bulkScheduledAt)
    if (Number.isNaN(parsed.getTime())) return bulkScheduledAt
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [bulkScheduledAt])

  const loadBulkOptions = useCallback(async () => {
    if (!bulkOpen) return

    const needsRoles = bulkRoles.length === 0
    const needsUsers = bulkUsers.length === 0
    if (!needsRoles && !needsUsers) return

    try {
      if (needsRoles) setBulkRolesLoading(true)
      if (needsUsers) setBulkUsersLoading(true)

      const tasks: Promise<unknown>[] = []
      if (needsRoles) {
        tasks.push(
          getRoles({ page: 1, page_size: 20 })
            .then(async (res) => {
              const firstBatch = res.data?.data?.roles ?? []
              const total = res.data?.data?.total ?? firstBatch.length
              const pageSize = 20
              const totalPages = Math.max(1, Math.ceil(total / pageSize))
              if (totalPages <= 1) {
                setBulkRoles(firstBatch)
                return
              }

              const remainingRequests: Array<ReturnType<typeof getRoles>> = []
              for (let page = 2; page <= totalPages; page += 1) {
                remainingRequests.push(getRoles({ page, page_size: pageSize }))
              }

              try {
                const responses = await Promise.all(remainingRequests)
                const rest = responses.flatMap((r) => r.data?.data?.roles ?? [])
                setBulkRoles([...firstBatch, ...rest])
              } catch {
                setBulkRoles(firstBatch)
              }
            })
            .catch(() => {
              setBulkRoles([])
            }),
        )
      }

      if (needsUsers) {
        tasks.push(
          getUsers(1, 20)
            .then(async (res) => {
              const firstBatch = res.data?.data?.users ?? []
              const total = res.data?.data?.total ?? firstBatch.length
              const pageSize = 20
              const totalPages = Math.max(1, Math.ceil(total / pageSize))
              if (totalPages <= 1) {
                setBulkUsers(firstBatch)
                return
              }

              const remainingRequests: Array<ReturnType<typeof getUsers>> = []
              for (let page = 2; page <= totalPages; page += 1) {
                remainingRequests.push(getUsers(page, pageSize))
              }

              try {
                const responses = await Promise.all(remainingRequests)
                const rest = responses.flatMap((r) => r.data?.data?.users ?? [])
                setBulkUsers([...firstBatch, ...rest])
              } catch {
                setBulkUsers(firstBatch)
              }
            })
            .catch(() => {
              setBulkUsers([])
            }),
        )
      }

      await Promise.all(tasks)
    } finally {
      setBulkRolesLoading(false)
      setBulkUsersLoading(false)
    }
  }, [bulkOpen, bulkRoles.length, bulkUsers.length])

  useEffect(() => {
    loadBulkOptions()
  }, [loadBulkOptions])

  useEffect(() => {
    if (!scheduleMenuOpen) return
    if (!bulkScheduledAt) {
      setScheduleYear("")
      setScheduleMonth("")
      setScheduleDay("")
      setScheduleHour("")
      setScheduleMinute("")
      return
    }
    const [datePart = "", timePart = ""] = bulkScheduledAt.split("T")
    const [y = "", m = "", d = ""] = datePart.split("-")
    const [hh = "", mm = ""] = timePart.split(":")
    setScheduleYear(y)
    setScheduleMonth(m)
    setScheduleDay(d)
    setScheduleHour(hh)
    setScheduleMinute(mm.slice(0, 2))
  }, [scheduleMenuOpen, bulkScheduledAt])

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
  const startEntry = totalCount === 0 ? 0 : offset + 1
  const endEntry = Math.min(offset + PAGE_SIZE, totalCount)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push("...")
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const filteredNotifications = notifications.filter((n) => {
    if (channelFilter !== "all" && n.delivery_channel !== channelFilter) return false
    if (activeStatusTab === "read" && !n.is_read) return false
    if (activeStatusTab === "unread" && n.is_read) return false
    if (typeFilter !== "all" && n.type !== typeFilter) return false
    if (levelFilter !== "all" && n.level !== levelFilter) return false
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const haystack = [
        getNotificationTitle(n),
        getNotificationMessage(n),
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
                onClick={() => setBulkOpen(true)}
              >
                <Mail className="mr-2 h-3.5 w-3.5" />
                Send notification
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
                        <SpinnerIcon className="mr-2 h-3.5 w-3.5" />
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
                        <SpinnerIcon className="mr-2 h-3.5 w-3.5" />
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
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/90 text-white">
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
          <SpinnerIcon className="h-6 w-6" />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-[130px] justify-between rounded-lg border-grayScale-200 px-2.5 text-xs font-normal text-grayScale-600"
                      >
                        <span className="truncate">{channelFilter === "all" ? "All" : channelFilter.toUpperCase()}</span>
                        <ChevronDown className="ml-2 h-3.5 w-3.5 text-grayScale-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[130px]">
                      <DropdownMenuRadioGroup
                        value={channelFilter}
                        onValueChange={(value) => setChannelFilter(value as typeof channelFilter)}
                      >
                        <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="push">Push</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="sms">SMS</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-grayScale-500">Type</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-[150px] justify-between rounded-lg border-grayScale-200 px-2.5 text-xs font-normal text-grayScale-600"
                      >
                        <span className="truncate">
                          {typeFilter === "all" ? "All types" : formatTypeLabel(typeFilter)}
                        </span>
                        <ChevronDown className="ml-2 h-3.5 w-3.5 text-grayScale-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[220px]">
                      <DropdownMenuRadioGroup value={typeFilter} onValueChange={setTypeFilter}>
                        <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                        {Array.from(new Set(notifications.map((n) => n.type))).map((t) => (
                          <DropdownMenuRadioItem key={t} value={t}>
                            {formatTypeLabel(t)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-grayScale-500">Level</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-[130px] justify-between rounded-lg border-grayScale-200 px-2.5 text-xs font-normal text-grayScale-600"
                      >
                        <span className="truncate">{levelFilter === "all" ? "All levels" : levelFilter}</span>
                        <ChevronDown className="ml-2 h-3.5 w-3.5 text-grayScale-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[150px]">
                      <DropdownMenuRadioGroup value={levelFilter} onValueChange={setLevelFilter}>
                        <DropdownMenuRadioItem value="all">All levels</DropdownMenuRadioItem>
                        {Array.from(new Set(notifications.map((n) => n.level))).map((lvl) => (
                          <DropdownMenuRadioItem key={lvl} value={lvl}>
                            {lvl}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border bg-white shadow-none">
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
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <BellOff className="h-8 w-8 text-grayScale-200" />
                          <div>
                            <p className="text-sm font-medium text-grayScale-500">No notifications match your filters</p>
                            <p className="mt-1 text-xs text-grayScale-400">Try adjusting your filters</p>
                          </div>
                        </div>
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
                              {getNotificationTitle(n)}
                            </p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <p className="max-w-sm truncate text-xs text-grayScale-500">
                              {getNotificationMessage(n)}
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
                                  <SpinnerIcon className="h-3.5 w-3.5" />
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-medium text-grayScale-600">
                  {startEntry}-{endEntry}
                </span>
                <span>of</span>
                <span className="font-medium text-grayScale-600">{totalCount}</span>
                <span className="mr-4">entries</span>
                <span className="border-l pl-4">Rows per page</span>
                <div className="relative">
                  <select
                    value={PAGE_SIZE}
                    disabled
                    className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
                  >
                    <option value={PAGE_SIZE}>{PAGE_SIZE}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => currentPage > 1 && setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={currentPage <= 1}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    currentPage <= 1 && "cursor-not-allowed opacity-50",
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
                      onClick={() => setOffset((n - 1) * PAGE_SIZE)}
                      className={cn(
                        "h-8 w-8 rounded-md border text-sm font-medium",
                        n === currentPage
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "bg-white text-grayScale-600 hover:bg-grayScale-50",
                      )}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => currentPage < totalPages && setOffset(offset + PAGE_SIZE)}
                  disabled={currentPage >= totalPages}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    currentPage >= totalPages && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
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
                  {getNotificationTitle(selectedNotification)}
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
                  {getNotificationMessage(selectedNotification)}
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
                      <SpinnerIcon className="mr-2 h-4 w-4" />
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
                      <SpinnerIcon className="mr-2 h-3.5 w-3.5" />
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

      {/* Bulk send dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-brand-500" />
              <span>Send notification</span>
            </DialogTitle>
            <DialogDescription>
              Send a bulk SMS, email, or push notification to users.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!bulkMessage.trim()) {
                toast.error("Message is required")
                return
              }
              const userIds = bulkUserIds

              try {
                setBulkSending(true)

                if (bulkChannel === "sms") {
                  if (userIds.length === 0) {
                    toast.error("User IDs are required for bulk SMS")
                    setBulkSending(false)
                    return
                  }
                  await sendBulkSms({
                    message: bulkMessage.trim(),
                    user_ids: userIds,
                    ...(bulkScheduledAt ? { scheduled_at: bulkScheduledAt } : {}),
                  })
                } else if (bulkChannel === "email") {
                  const form = new FormData()
                  if (!bulkTitle.trim()) {
                    toast.error("Subject is required for bulk email")
                    setBulkSending(false)
                    return
                  }
                  form.append("subject", bulkTitle.trim())
                  form.append("message", bulkMessage.trim())
                  if (bulkRole.trim()) form.append("role", bulkRole.trim())
                  if (userIds.length > 0) {
                    form.append("user_ids", JSON.stringify(userIds))
                  }
                  if (bulkScheduledAt) form.append("scheduled_at", bulkScheduledAt)
                  if (bulkFile) form.append("file", bulkFile)
                  await sendBulkEmail(form)
                } else {
                  const form = new FormData()
                  if (!bulkTitle.trim()) {
                    toast.error("Title is required for bulk push")
                    setBulkSending(false)
                    return
                  }
                  form.append("title", bulkTitle.trim())
                  form.append("message", bulkMessage.trim())
                  if (bulkRole.trim()) form.append("role", bulkRole.trim())
                  if (userIds.length > 0) {
                    form.append("user_ids", JSON.stringify(userIds))
                  }
                  if (bulkScheduledAt) form.append("scheduled_at", bulkScheduledAt)
                  if (bulkFile) form.append("file", bulkFile)
                  await sendBulkPush(form)
                }

                toast.success("Notification scheduled", {
                  description: bulkScheduledAt
                    ? "Notification has been scheduled successfully."
                    : "Notification has been sent successfully.",
                })

                setBulkTitle("")
                setBulkMessage("")
                setBulkRole("")
                setBulkUserIds([])
                setBulkScheduledAt("")
                setBulkFile(null)
                setBulkChannel("sms")
                setBulkOpen(false)
              } catch (err: any) {
                const msg =
                  err?.response?.data?.message ||
                  "Failed to send notification. Please try again."
                toast.error("Failed to send notification", { description: msg })
              } finally {
                setBulkSending(false)
              }
            }}
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Channel
                  </label>
                  <Select
                    value={bulkChannel}
                    onChange={(e) => setBulkChannel(e.target.value as typeof bulkChannel)}
                  >
                    <option value="sms">Bulk SMS</option>
                    <option value="email">Bulk email</option>
                    <option value="push">Bulk push</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    {bulkChannel === "email" ? "Subject" : "Title (push only)"}
                  </label>
                  <Input
                    placeholder={
                      bulkChannel === "email"
                        ? `e.g. "System Update"`
                        : `e.g. "System Update"`
                    }
                    value={bulkTitle}
                    onChange={(e) => setBulkTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Message
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={
                      bulkChannel === "sms"
                        ? "Text body to send by SMS."
                        : "Notification body for email or push."
                    }
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-500">
                      Role (optional)
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={bulkRolesLoading}
                          className={cn(
                            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            bulkRolesLoading && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span className="truncate text-left">
                            {bulkRolesLoading ? "Loading roles..." : bulkRole || "All roles"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-grayScale-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[220px]">
                        <DropdownMenuLabel>Roles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={bulkRole}
                          onValueChange={(value) => {
                            setBulkRole(value)
                            setBulkUserIds([])
                          }}
                        >
                          <DropdownMenuRadioItem value="">All roles</DropdownMenuRadioItem>
                          {bulkRoles.map((role) => (
                            <DropdownMenuRadioItem key={role.id} value={role.name}>
                              {role.name}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-500">
                      Users (optional)
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={bulkUsersLoading}
                          className={cn(
                            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            bulkUsersLoading && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span className="truncate text-left">
                            {bulkUsersLoading
                              ? "Loading users..."
                              : bulkUserIds.length === 0
                                ? "Select users"
                                : `${bulkUserIds.length} user(s) selected`}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-grayScale-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[320px]">
                        <DropdownMenuLabel>Users</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setBulkUserIds(filteredBulkUsers.map((u) => u.id))
                          }}
                          disabled={filteredBulkUsers.length === 0}
                        >
                          Select all
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setBulkUserIds([])
                          }}
                          disabled={bulkUserIds.length === 0}
                        >
                          Deselect all
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="max-h-64 overflow-y-auto">
                          {filteredBulkUsers.length === 0 ? (
                            <p className="px-2 py-2 text-xs text-grayScale-400">No users available</p>
                          ) : (
                            filteredBulkUsers.map((user) => {
                              const isChecked = bulkUserIds.includes(user.id)
                              return (
                                <DropdownMenuCheckboxItem
                                  key={user.id}
                                  checked={isChecked}
                                  onSelect={(e) => e.preventDefault()}
                                  onCheckedChange={(checked) => {
                                    setBulkUserIds((prev) => {
                                      if (checked) return prev.includes(user.id) ? prev : [...prev, user.id]
                                      return prev.filter((id) => id !== user.id)
                                    })
                                  }}
                                >
                                  {user.first_name} {user.last_name} ({user.id})
                                </DropdownMenuCheckboxItem>
                              )
                            })
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-[11px] text-grayScale-400">Choose one or more users from the dropdown list.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)]">
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-500">
                  File attachment (optional)
                </label>
                <FileUpload
                  accept="image/*"
                  onFileSelect={setBulkFile}
                  label="Upload image or file"
                  description="Optional image or asset to attach"
                  className="min-h-[110px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-xs font-medium text-grayScale-500">
                  Scheduled at (optional)
                </label>
                <DropdownMenu open={scheduleMenuOpen} onOpenChange={setScheduleMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-11 w-full items-center justify-between rounded-xl border border-grayScale-200 bg-grayScale-50/70 px-3 text-sm text-grayScale-700 shadow-sm transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100",
                      )}
                    >
                      <span className="truncate text-left">{scheduledAtLabel}</span>
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-grayScale-200 bg-white px-2 py-1 text-[11px] text-grayScale-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <Clock3 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[320px] p-3">
                    <p className="mb-2 text-xs font-semibold text-grayScale-500">Schedule notification</p>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-grayScale-500">Date</label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="text"
                            placeholder="YYYY"
                            value={scheduleYear}
                            onChange={(e) => setScheduleYear(digitsOnly(e.target.value, 4))}
                            inputMode="numeric"
                            maxLength={4}
                            className="h-9 rounded-lg border-grayScale-200 bg-white text-center text-sm"
                          />
                          <span className="text-grayScale-400">-</span>
                          <Input
                            type="text"
                            placeholder="MM"
                            value={scheduleMonth}
                            onChange={(e) => setScheduleMonth(digitsOnly(e.target.value, 2))}
                            inputMode="numeric"
                            maxLength={2}
                            className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
                          />
                          <span className="text-grayScale-400">-</span>
                          <Input
                            type="text"
                            placeholder="DD"
                            value={scheduleDay}
                            onChange={(e) => setScheduleDay(digitsOnly(e.target.value, 2))}
                            inputMode="numeric"
                            maxLength={2}
                            className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-grayScale-500">Time</label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="text"
                            placeholder="HH"
                            value={scheduleHour}
                            onChange={(e) => setScheduleHour(digitsOnly(e.target.value, 2))}
                            inputMode="numeric"
                            maxLength={2}
                            className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
                          />
                          <span className="text-grayScale-400">:</span>
                          <Input
                            type="text"
                            placeholder="MM"
                            value={scheduleMinute}
                            onChange={(e) => setScheduleMinute(digitsOnly(e.target.value, 2))}
                            inputMode="numeric"
                            maxLength={2}
                            className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            const now = new Date()
                            setScheduleYear(String(now.getFullYear()))
                            setScheduleMonth(String(now.getMonth() + 1).padStart(2, "0"))
                            setScheduleDay(String(now.getDate()).padStart(2, "0"))
                          }}
                        >
                          Today
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setScheduleYear("")
                            setScheduleMonth("")
                            setScheduleDay("")
                            setScheduleHour("")
                            setScheduleMinute("")
                            setBulkScheduledAt("")
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          const year = Number(scheduleYear)
                          const month = Number(scheduleMonth)
                          const day = Number(scheduleDay)
                          const hour = Number(scheduleHour)
                          const minute = Number(scheduleMinute)

                          const formatOk =
                            scheduleYear.length === 4 &&
                            scheduleMonth.length === 2 &&
                            scheduleDay.length === 2 &&
                            scheduleHour.length === 2 &&
                            scheduleMinute.length === 2
                          const dateValue = new Date(year, month - 1, day)
                          const dateOk =
                            formatOk &&
                            month >= 1 &&
                            month <= 12 &&
                            day >= 1 &&
                            day <= 31 &&
                            dateValue.getFullYear() === year &&
                            dateValue.getMonth() === month - 1 &&
                            dateValue.getDate() === day
                          const timeOk = hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59

                          if (!dateOk || !timeOk) {
                            toast.error("Use valid date/time format", {
                              description: "Date: YYYY-MM-DD, Time: HH:MM (24h).",
                            })
                            return
                          }
                          setBulkScheduledAt(
                            `${scheduleYear}-${scheduleMonth}-${scheduleDay}T${scheduleHour}:${scheduleMinute}`,
                          )
                          setScheduleMenuOpen(false)
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-[11px] text-grayScale-400">
                  Leave empty to send immediately. When set, the notification is stored in{" "}
                  <code>scheduled_notifications</code> and sent at the specified time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkTitle("")
                  setBulkMessage("")
                  setBulkRole("")
                  setBulkUserIds([])
                  setBulkScheduledAt("")
                  setBulkFile(null)
                  setBulkChannel("sms")
                  setBulkOpen(false)
                }}
                disabled={bulkSending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={bulkSending || !bulkMessage.trim()}>
                {bulkSending ? (
                  <>
                    <SpinnerIcon className="mr-2 h-3.5 w-3.5" />
                    Sending…
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-3.5 w-3.5" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
