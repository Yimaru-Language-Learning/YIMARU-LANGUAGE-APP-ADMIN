import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BellOff, CheckCheck, Mail, MailOpen, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import { SpinnerIcon } from "../ui/spinner-icon"
import { getNotificationById } from "../../api/notifications.api"
import { useNotifications } from "../../hooks/useNotifications"
import { NotificationDetailDialog } from "../notifications/NotificationDetailDialog"
import { NotificationDeleteDialog } from "../notifications/NotificationDeleteDialog"
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationTimestamp,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay"
import { getNotificationMessage, getNotificationTitle, type Notification } from "../../types/notification.types"

function NotificationItem({
  notification,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification
  onOpen: (notification: Notification) => void
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
  onDelete: (notification: Notification) => void
}) {
  const cfg = NOTIFICATION_TYPE_CONFIG[notification.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
  const Icon = cfg.icon

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-grayScale-100",
      )}
      onClick={() => onOpen(notification)}
    >
      {!notification.is_read && (
        <span className="absolute left-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-500" />
      )}

      <span
        className={cn(
          "ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          cfg.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug text-grayScale-900",
            !notification.is_read && "font-semibold",
          )}
        >
          {getNotificationTitle(notification) || "Notification"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-grayScale-700">
          {getNotificationMessage(notification) || "No preview text available."}
        </p>
        <p className="mt-1 text-[11px] text-grayScale-600">
          {formatNotificationTimestamp(notification.timestamp)}
        </p>
      </div>

      <button
        type="button"
        className="hidden shrink-0 self-center rounded-md p-1.5 text-grayScale-400 hover:bg-grayScale-200 hover:text-grayScale-600 group-hover:block"
        onClick={(e) => {
          e.stopPropagation()
          if (notification.is_read) {
            onMarkUnread(notification.id)
          } else {
            onMarkRead(notification.id)
          }
        }}
        aria-label={notification.is_read ? "Mark as unread" : "Mark as read"}
      >
        {notification.is_read ? (
          <Mail className="h-4 w-4" />
        ) : (
          <MailOpen className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        className="hidden shrink-0 self-center rounded-md p-1.5 text-destructive hover:bg-destructive/10 group-hover:block"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification)
        }}
        aria-label="Delete notification"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </button>
  )
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [notificationPendingDelete, setNotificationPendingDelete] = useState<Notification | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markOneUnread,
    markAllAsRead,
    refresh,
  } = useNotifications()

  const loadNotificationDetail = useCallback(async (id: string, markReadIfNeeded: boolean) => {
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
      if (markReadIfNeeded && !res.data.is_read) {
        void markOneRead(id)
      }
    } catch {
      setDetailError(true)
      toast.error("Failed to load notification details")
    } finally {
      setDetailLoading(false)
    }
  }, [markOneRead])

  const handleOpenNotification = useCallback(
    (notification: Notification) => {
      setOpen(false)
      void loadNotificationDetail(notification.id, !notification.is_read)
    },
    [loadNotificationDetail],
  )

  const handleNotificationDeleted = useCallback((id: string) => {
    if (selectedNotificationId === id) {
      setDetailOpen(false)
      setSelectedNotification(null)
      setSelectedNotificationId(null)
    }
    setNotificationPendingDelete(null)
    refresh()
  }, [selectedNotificationId, refresh])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleMouseDown)
    }
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [open])

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-full border bg-white text-grayScale-500 transition-colors hover:text-brand-600"
          aria-label="Notifications"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="animate-in fade-in-0 zoom-in-95 absolute right-0 top-12 z-50 w-[380px] rounded-xl bg-white shadow-lg ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-grayScale-800">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-grayScale-500 transition-colors hover:bg-grayScale-100 hover:text-grayScale-700"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <SpinnerIcon className="h-6 w-6" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-grayScale-400">
                  <BellOff className="h-8 w-8" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="p-1">
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onOpen={handleOpenNotification}
                      onMarkRead={markOneRead}
                      onMarkUnread={markOneUnread}
                      onDelete={(notification) => {
                        setOpen(false)
                        setNotificationPendingDelete(notification)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-4 py-2.5">
              <button
                type="button"
                className="w-full rounded-lg py-1.5 text-center text-sm font-medium text-brand-600 transition-colors hover:bg-grayScale-100"
                onClick={() => {
                  setOpen(false)
                  navigate("/notifications")
                }}
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        notification={selectedNotification}
        loading={detailLoading}
        error={detailError}
        onRetry={
          selectedNotificationId
            ? () => void loadNotificationDetail(selectedNotificationId, false)
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
    </>
  )
}
