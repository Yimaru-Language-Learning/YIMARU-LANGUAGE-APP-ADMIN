import { ArrowRight, X } from "lucide-react"
import { toast } from "sonner"
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationTimestamp,
  formatNotificationTypeLabel,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay"
import {
  getNotificationMessage,
  getNotificationTitle,
  type Notification,
} from "../../types/notification.types"
import { cn } from "../../lib/utils"

type ShowNotificationRealtimePopupOptions = {
  onOpen?: (notification: Notification) => void
}

function normalizeComparableText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function getLevelAccentClass(level: string) {
  switch (level) {
    case "error":
    case "critical":
      return "yimaru-realtime-popup--error"
    case "warning":
      return "yimaru-realtime-popup--warning"
    case "success":
      return "yimaru-realtime-popup--success"
    default:
      return "yimaru-realtime-popup--info"
  }
}

export function showNotificationRealtimePopup(
  notification: Notification,
  options?: ShowNotificationRealtimePopupOptions,
) {
  const cfg = NOTIFICATION_TYPE_CONFIG[notification.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
  const Icon = cfg.icon
  const rawTitle = getNotificationTitle(notification)
  const rawMessage = getNotificationMessage(notification)
  const title = rawTitle || rawMessage || "Notification"
  const message = rawMessage
  const showMessage =
    Boolean(message) &&
    normalizeComparableText(message) !== normalizeComparableText(title)

  toast.custom(
    (toastId) => (
      <div
        className={cn(
          "yimaru-realtime-popup pointer-events-auto",
          getLevelAccentClass(notification.level),
        )}
        role="status"
        aria-live="polite"
      >
        <div className="yimaru-realtime-popup__header">
          <div className="yimaru-realtime-popup__meta">
            <span className="yimaru-realtime-popup__type">
              {formatNotificationTypeLabel(notification.type)}
            </span>
            <span className="yimaru-realtime-popup__dot" aria-hidden />
            <time
              className="yimaru-realtime-popup__time"
              dateTime={notification.timestamp}
            >
              {formatNotificationTimestamp(notification.timestamp)}
            </time>
          </div>
          <button
            type="button"
            className="yimaru-realtime-popup__close"
            onClick={() => toast.dismiss(toastId)}
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="yimaru-realtime-popup__body">
          <div className={cn("yimaru-realtime-popup__icon", cfg.bg)}>
            <Icon className={cn("h-4 w-4", cfg.color)} />
          </div>

          <div className="yimaru-realtime-popup__content">
            <p className="yimaru-realtime-popup__title">{title}</p>
            {showMessage ? (
              <p className="yimaru-realtime-popup__message">{message}</p>
            ) : null}
            <button
              type="button"
              className="yimaru-realtime-popup__action"
              onClick={() => {
                toast.dismiss(toastId)
                options?.onOpen?.(notification)
              }}
            >
              View details
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    ),
    {
      position: "bottom-right",
      duration: 8000,
      unstyled: true,
      className: "yimaru-realtime-popup-host",
    },
  )
}
