import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BellOff, CheckCheck, Mail, MailOpen, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import { SpinnerIcon } from "../ui/spinner-icon"
import { resolveNotificationDetail } from "../../api/notifications.api"
import { useNotifications } from "../../hooks/useNotifications"
import { NotificationDetailDialog } from "../notifications/NotificationDetailDialog"
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationTimestamp,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay"
import {
  getNotificationMessage,
  getNotificationTitle,
  hasNotificationContent,
  type Notification,
} from "../../types/notification.types"

const SLIDE_OUT_MS = 360
const DELETE_UNDO_MS = 5000

type PendingDelete = {
  notification: Notification
  timeoutId: ReturnType<typeof setTimeout>
}

function NotificationItem({
  notification,
  isDismissing,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification
  isDismissing: boolean
  onOpen: (notification: Notification) => void
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
  onDelete: (notification: Notification) => void
}) {
  const cfg = NOTIFICATION_TYPE_CONFIG[notification.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
  const Icon = cfg.icon
  const slideRef = useRef<HTMLDivElement>(null)
  const [slideOut, setSlideOut] = useState(false)

  useLayoutEffect(() => {
    if (!isDismissing) {
      setSlideOut(false)
      return
    }

    const el = slideRef.current
    if (!el) return

    setSlideOut(false)
    void el.offsetHeight
    const frame = requestAnimationFrame(() => setSlideOut(true))
    return () => cancelAnimationFrame(frame)
  }, [isDismissing])

  return (
    <div className="overflow-hidden">
      <div
        ref={slideRef}
        className={cn(
          "w-full will-change-transform transition-[transform,opacity] duration-300 ease-in-out",
          slideOut ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100",
        )}
      >
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
      </div>
    </div>
  )
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const slideTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingDeleteRef = useRef<PendingDelete | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markOneUnread,
    markAllAsRead,
    commitDeleteNotification,
  } = useNotifications()

  const clearPendingDelete = useCallback((restore = false) => {
    const current = pendingDeleteRef.current
    if (!current) return
    clearTimeout(current.timeoutId)
    pendingDeleteRef.current = null
    setPendingDelete(null)
    if (restore) {
      setHiddenIds((prev) => {
        const next = new Set(prev)
        next.delete(current.notification.id)
        return next
      })
    }
  }, [])

  const commitPendingDelete = useCallback(async (pending: PendingDelete) => {
    if (pendingDeleteRef.current?.timeoutId === pending.timeoutId) {
      pendingDeleteRef.current = null
      setPendingDelete(null)
    }
    try {
      await commitDeleteNotification(pending.notification)
      setHiddenIds((prev) => {
        const next = new Set(prev)
        next.delete(pending.notification.id)
        return next
      })
      if (selectedNotificationId === pending.notification.id) {
        setDetailOpen(false)
        setSelectedNotification(null)
        setSelectedNotificationId(null)
      }
    } catch {
      setHiddenIds((prev) => {
        const next = new Set(prev)
        next.delete(pending.notification.id)
        return next
      })
      toast.error("Failed to delete notification")
    }
  }, [commitDeleteNotification, selectedNotificationId])

  const flushPendingDelete = useCallback(() => {
    const current = pendingDeleteRef.current
    if (!current) return
    clearTimeout(current.timeoutId)
    pendingDeleteRef.current = null
    setPendingDelete(null)
    void commitPendingDelete(current)
  }, [commitPendingDelete])

  const beginDeleteWithUndo = useCallback(
    (notification: Notification) => {
      if (dismissingIds.has(notification.id) || hiddenIds.has(notification.id)) return

      flushPendingDelete()

      setDismissingIds((prev) => new Set(prev).add(notification.id))

      const slideTimer = setTimeout(() => {
        slideTimersRef.current.delete(notification.id)
        setDismissingIds((prev) => {
          const next = new Set(prev)
          next.delete(notification.id)
          return next
        })
        setHiddenIds((prev) => new Set(prev).add(notification.id))

        const timeoutId = setTimeout(() => {
          void commitPendingDelete({ notification, timeoutId })
        }, DELETE_UNDO_MS)

        const pending = { notification, timeoutId }
        pendingDeleteRef.current = pending
        setPendingDelete(pending)
      }, SLIDE_OUT_MS)

      slideTimersRef.current.set(notification.id, slideTimer)
    },
    [commitPendingDelete, dismissingIds, flushPendingDelete, hiddenIds],
  )

  const handleUndoDelete = useCallback(() => {
    clearPendingDelete(true)
  }, [clearPendingDelete])

  const loadNotificationDetail = useCallback(
    async (notification: Notification, markReadIfNeeded: boolean) => {
      setDetailLoading(true)
      setDetailError(false)
      setSelectedNotification(notification)
      setSelectedNotificationId(notification.id)
      setDetailOpen(true)

      try {
        const resolved = await resolveNotificationDetail(notification)
        if (!hasNotificationContent(resolved)) {
          setDetailError(true)
          toast.error("Notification not found")
          return
        }
        setSelectedNotification(resolved)
        if (markReadIfNeeded && !resolved.is_read) {
          void markOneRead(resolved.id)
        }
      } catch {
        if (hasNotificationContent(notification)) {
          setSelectedNotification(notification)
          if (markReadIfNeeded && !notification.is_read) {
            void markOneRead(notification.id)
          }
        } else {
          setDetailError(true)
          toast.error("Failed to load notification details")
        }
      } finally {
        setDetailLoading(false)
      }
    },
    [markOneRead],
  )

  const handleOpenNotification = useCallback(
    (notification: Notification) => {
      setOpen(false)
      void loadNotificationDetail(notification, !notification.is_read)
    },
    [loadNotificationDetail],
  )

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

  useEffect(() => {
    return () => {
      slideTimersRef.current.forEach((timer) => clearTimeout(timer))
      slideTimersRef.current.clear()
      const current = pendingDeleteRef.current
      if (current) clearTimeout(current.timeoutId)
      pendingDeleteRef.current = null
    }
  }, [])

  const visibleNotifications = notifications.filter((n) => !hiddenIds.has(n.id))

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
          <div className="animate-in fade-in-0 zoom-in-95 absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-xl bg-white shadow-lg ring-1 ring-black/5">
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
              ) : visibleNotifications.length === 0 && !pendingDelete ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-grayScale-400">
                  <BellOff className="h-8 w-8" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="p-1">
                  {visibleNotifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      isDismissing={dismissingIds.has(n.id)}
                      onOpen={handleOpenNotification}
                      onMarkRead={markOneRead}
                      onMarkUnread={markOneUnread}
                      onDelete={beginDeleteWithUndo}
                    />
                  ))}
                </div>
              )}
            </div>

            {pendingDelete ? (
              <div className="animate-in slide-in-from-bottom-2 fade-in-0 border-t bg-grayScale-900 px-4 py-2.5 duration-200">
                <div className="flex items-center justify-between gap-3 text-xs text-white">
                  <span className="truncate text-grayScale-100">Notification deleted</span>
                  <button
                    type="button"
                    className="shrink-0 rounded-md px-2 py-1 font-semibold text-brand-300 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={handleUndoDelete}
                  >
                    Undo
                  </button>
                </div>
              </div>
            ) : null}

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
          selectedNotificationId && selectedNotification
            ? () => void loadNotificationDetail(selectedNotification, false)
            : undefined
        }
        onDelete={
          selectedNotification
            ? () => {
                setDetailOpen(false)
                setOpen(true)
                beginDeleteWithUndo(selectedNotification)
              }
            : undefined
        }
      />
    </>
  )
}
