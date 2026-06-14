import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { SpinnerIcon } from "../ui/spinner-icon"
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationDateTime,
  formatNotificationTimestamp,
  formatNotificationTypeLabel,
  getNotificationLevelBadge,
  isMeaningfulExpiry,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay"
import { getNotificationMessage, getNotificationTitle, type Notification } from "../../types/notification.types"

type NotificationDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification: Notification | null
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  onDelete?: () => void
}

export function NotificationDetailDialog({
  open,
  onOpenChange,
  notification,
  loading = false,
  error = false,
  onRetry,
  onDelete,
}: NotificationDetailDialogProps) {
  const config = notification
    ? NOTIFICATION_TYPE_CONFIG[notification.type] ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
    : DEFAULT_NOTIFICATION_TYPE_CONFIG
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <SpinnerIcon className="h-8 w-8 text-brand-500" />
            <p className="text-sm text-grayScale-500">Loading notification…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-grayScale-700">Could not load notification</p>
            {onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : notification ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${config.bg} ${config.color}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate text-base">
                  {getNotificationTitle(notification) || "Notification"}
                </span>
              </DialogTitle>
              <DialogDescription>
                Sent via {notification.delivery_channel || "in-app"} ·{" "}
                {formatNotificationTimestamp(notification.timestamp)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {notification.image ? (
                <div className="overflow-hidden rounded-lg border border-grayScale-200 bg-grayScale-50">
                  <img
                    src={notification.image}
                    alt=""
                    className="max-h-48 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="rounded-lg bg-grayScale-50 p-3">
                <p className="text-sm leading-relaxed text-grayScale-600">
                  {getNotificationMessage(notification) || "No message content."}
                </p>
              </div>

              <div className="grid gap-3 text-xs text-grayScale-500 sm:grid-cols-2">
                <div>
                  <p className="text-grayScale-400">Type</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {formatNotificationTypeLabel(notification.type)}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Level</p>
                  <div className="mt-0.5">
                    <Badge variant={getNotificationLevelBadge(notification.level)} className="text-[10px]">
                      {notification.level || "—"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-grayScale-400">Channel</p>
                  <p className="mt-0.5 font-medium capitalize text-grayScale-700">
                    {notification.delivery_channel || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Delivery status</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {notification.delivery_status || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-grayScale-400">Read status</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {notification.is_read ? "Read" : "Unread"}
                  </p>
                </div>
                {notification.receiver_type ? (
                  <div>
                    <p className="text-grayScale-400">Receiver</p>
                    <p className="mt-0.5 font-medium capitalize text-grayScale-700">
                      {notification.receiver_type}
                    </p>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <p className="text-grayScale-400">Sent at</p>
                  <p className="mt-0.5 font-medium text-grayScale-700">
                    {formatNotificationDateTime(notification.timestamp)}
                  </p>
                </div>
                {isMeaningfulExpiry(notification.expires) ? (
                  <div className="sm:col-span-2">
                    <p className="text-grayScale-400">Expires</p>
                    <p className="mt-0.5 font-medium text-grayScale-700">
                      {formatNotificationDateTime(notification.expires)}
                    </p>
                  </div>
                ) : null}
              </div>

              {notification.payload.tags && notification.payload.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {notification.payload.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {onDelete ? (
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="destructive" onClick={onDelete}>
                  Delete notification
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
