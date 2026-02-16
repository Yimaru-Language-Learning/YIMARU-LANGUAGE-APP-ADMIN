import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  BellOff,
  Info,
  AlertCircle,
  CheckCircle2,
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
} from "lucide-react"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import { useNotifications } from "../../hooks/useNotifications"
import type { Notification } from "../../types/notification.types"

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

function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE_CONFIG
  const Icon = cfg.icon

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-grayScale-100",
        !notification.is_read && "bg-brand-100/30"
      )}
      onClick={() => {
        if (!notification.is_read) onMarkRead(notification.id)
      }}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-500" />
      )}

      {/* Type icon */}
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          cfg.bg
        )}
      >
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug text-grayScale-800",
            !notification.is_read && "font-semibold"
          )}
        >
          {notification.payload.headline}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-grayScale-500">
          {notification.payload.message}
        </p>
        <p className="mt-1 text-[11px] text-grayScale-400">
          {formatTimestamp(notification.timestamp)}
        </p>
      </div>

      {/* Read / Unread toggle */}
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
    </button>
  )
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markOneUnread,
    markAllAsRead,
  } = useNotifications()

  // Click-outside handler
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
    <div ref={containerRef} className="relative">
      {/* Bell button */}
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

      {/* Dropdown panel */}
      {open && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute right-0 top-12 z-50 w-[380px] rounded-xl bg-white shadow-lg ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-grayScale-800">
                Notifications
              </h3>
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

          {/* Body */}
          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-grayScale-400" />
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
                    onMarkRead={markOneRead}
                    onMarkUnread={markOneUnread}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
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
  )
}
