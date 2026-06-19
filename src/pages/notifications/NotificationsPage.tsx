import { useEffect, useState, useCallback } from "react"
import {
  Bell,
  BellOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  Mail,
  CheckCheck,
  MailX,
  Search,
  ChevronDown,
  Trash2,
} from "lucide-react"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages"
import { cn } from "../../lib/utils"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { useNavigate } from "react-router-dom"
import {
  getNotificationById,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
  markAllUnread,
} from "../../api/notifications.api"
import { NotificationDetailDialog } from "../../components/notifications/NotificationDetailDialog"
import { NotificationDeleteDialog } from "../../components/notifications/NotificationDeleteDialog"
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationTimestamp,
  formatNotificationTypeLabel,
  getNotificationLevelBadge,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay"
import { getNotificationMessage, getNotificationTitle, type Notification } from "../../types/notification.types"
import { toast } from "sonner"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"

function NotificationItem({
  notification,
  onToggleRead,
  toggling,
}: {
  notification: Notification
  onToggleRead: (id: string, currentlyRead: boolean) => void
  toggling: boolean
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
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
              <Badge variant={getNotificationLevelBadge(notification.level)} className="text-[10px] px-1.5 py-0">
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
              {formatNotificationTimestamp(notification.timestamp)}
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
            {formatNotificationTypeLabel(notification.type)}
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
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [allCount, setAllCount] = useState(0)
  const [globalUnread, setGlobalUnread] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [notificationPendingDelete, setNotificationPendingDelete] = useState<Notification | null>(null)

  const [channelFilter, setChannelFilter] = useState<"all" | "push" | "sms">("all")
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "read" | "unread">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all")
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [allNotifications, unreadRes] = await Promise.all([
        fetchAllOffsetPages(async (batchOffset, limit) => {
          const notifRes = await getNotifications(limit, batchOffset)
          return {
            items: notifRes.data.notifications ?? [],
            total_count: notifRes.data.total_count,
          }
        }),
        getUnreadCount(),
      ])
      setNotifications(allNotifications)
      setAllCount(allNotifications.length)
      setGlobalUnread(unreadRes.data.unread)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    setOffset(0)
  }, [searchTerm, channelFilter, activeStatusTab, typeFilter, levelFilter, pageSize])

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
      setGlobalUnread(allCount)
    } catch {
      // silently fail
    } finally {
      setBulkLoading(false)
    }
  }, [allCount])

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
        formatNotificationTypeLabel(n.type),
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

  const totalCount = filteredNotifications.length
  const paginatedNotifications = filteredNotifications.slice(offset, offset + pageSize)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.floor(offset / pageSize) + 1
  const startEntry = totalCount === 0 ? 0 : offset + 1
  const endEntry = Math.min(offset + paginatedNotifications.length, totalCount)

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

  const activeFilterCount = countActiveFilters([
    { value: activeStatusTab, defaultValue: "all" },
    { value: channelFilter, defaultValue: "all" },
    { value: typeFilter, defaultValue: "all" },
    { value: levelFilter, defaultValue: "all" },
  ])

  const clearFilters = () => {
    setActiveStatusTab("all")
    setChannelFilter("all")
    setTypeFilter("all")
    setLevelFilter("all")
  }

  const loadNotificationDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetailError(false)
    setSelectedNotification(null)
    setSelectedNotificationId(id)
    setDetailOpen(true)

    try {
      const res = await getNotificationById(id)
      if (!res.data) {
        setDetailError(true)
        toast.error("Notification not found")
        return
      }
      setSelectedNotification(res.data)
      if (!res.data.is_read) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        )
        setGlobalUnread((prev) => Math.max(0, prev - 1))
        try {
          await markAsRead(id)
        } catch {
          // list refresh on next load will reconcile
        }
      }
    } catch {
      setDetailError(true)
      toast.error("Failed to load notification details")
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleOpenDetail = (notification: Notification) => {
    void loadNotificationDetail(notification.id)
  }

  const handleNotificationDeleted = useCallback((id: string) => {
    const removed = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setTotalCount((prev) => Math.max(0, prev - 1))
    if (removed && !removed.is_read) {
      setGlobalUnread((prev) => Math.max(0, prev - 1))
    }
    if (selectedNotificationId === id) {
      setDetailOpen(false)
      setSelectedNotification(null)
      setSelectedNotificationId(null)
    }
    setNotificationPendingDelete(null)
    window.dispatchEvent(new Event("notifications-updated"))
  }, [notifications, selectedNotificationId])

  return (
    <div className="mx-auto w-full max-w-6xl bg-grayScale-50/60 rounded-2xl px-3 py-4 sm:px-4 sm:py-5">
      {/* Header */}
      <div className="mb-5">
        <div className="mb-1 text-sm font-semibold text-grayScale-500">Notifications</div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">My Notifications</h1>
            {totalCount > 0 && <Badge variant="secondary">{totalCount}</Badge>}
            {globalUnread > 0 && <Badge variant="default">{globalUnread} unread</Badge>}
          </div>

          {/* Bulk actions */}
          {!loading && !error && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-brand-500 text-white hover:bg-brand-600"
                onClick={() => navigate("/notifications/create")}
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
          <AdminFiltersPanel
            className="mb-3"
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            summary={`${totalCount} shown · ${allCount} total`}
            search={
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  placeholder="Search by title, message, or type…"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            <div className="border-b border-grayScale-200">
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
            <div className="flex flex-wrap items-center gap-3">
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
                        {typeFilter === "all" ? "All types" : formatNotificationTypeLabel(typeFilter)}
                      </span>
                      <ChevronDown className="ml-2 h-3.5 w-3.5 text-grayScale-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[220px]">
                    <DropdownMenuRadioGroup value={typeFilter} onValueChange={setTypeFilter}>
                      <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                      {Array.from(new Set(notifications.map((n) => n.type))).map((t) => (
                        <DropdownMenuRadioItem key={t} value={t}>
                          {formatNotificationTypeLabel(t)}
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
          </AdminFiltersPanel>

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
                    paginatedNotifications.map((n) => {
                      const config = NOTIFICATION_TYPE_CONFIG[n.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
                      const Icon = config.icon
                      const isToggling = togglingIds.has(n.id)
                      return (
                        <TableRow
                          key={n.id}
                          className={cn(
                            "cursor-pointer",
                            !n.is_read && "bg-brand-50/10 hover:bg-brand-50/25",
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
                                {formatNotificationTypeLabel(n.type)}
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
                              variant={getNotificationLevelBadge(n.level)}
                              className="text-[10px] uppercase tracking-wide"
                            >
                              {n.is_read ? "Read" : "Unread"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs text-grayScale-400">
                              {formatNotificationTimestamp(n.timestamp)}
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setNotificationPendingDelete(n)}
                                title="Delete notification"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setOffset(0)
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
                  onClick={() => currentPage > 1 && setOffset(Math.max(0, offset - pageSize))}
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
                      onClick={() => setOffset((n - 1) * pageSize)}
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
                  onClick={() => currentPage < totalPages && setOffset(offset + pageSize)}
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

      <NotificationDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        notification={selectedNotification}
        loading={detailLoading}
        error={detailError}
        onRetry={
          selectedNotificationId
            ? () => void loadNotificationDetail(selectedNotificationId)
            : undefined
        }
        onDelete={
          selectedNotification
            ? () => setNotificationPendingDelete(selectedNotification)
            : undefined
        }
      />

      <NotificationDeleteDialog
        notification={notificationPendingDelete}
        open={notificationPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setNotificationPendingDelete(null)
        }}
        onDeleted={handleNotificationDeleted}
      />
    </div>
  )
}
