import { useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { SpinnerIcon } from "../ui/spinner-icon";
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  formatNotificationDateTime,
  formatNotificationTimestamp,
  formatNotificationTypeLabel,
  isMeaningfulExpiry,
  NOTIFICATION_TYPE_CONFIG,
} from "../../lib/notificationDisplay";
import {
  getNotificationMessage,
  getNotificationTitle,
  type Notification,
} from "../../types/notification.types";
import { cn } from "../../lib/utils";

type NotificationDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onDelete?: () => void;
};

type Tab = "details" | "preview";

export function NotificationDetailDialog({
  open,
  onOpenChange,
  notification,
  loading = false,
  error = false,
  onRetry,
  onDelete,
}: NotificationDetailDialogProps) {
  const [tab, setTab] = useState<Tab>("details");

  const config = notification
    ? (NOTIFICATION_TYPE_CONFIG[notification.type] ??
      DEFAULT_NOTIFICATION_TYPE_CONFIG)
    : DEFAULT_NOTIFICATION_TYPE_CONFIG;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <SpinnerIcon className="h-8 w-8 text-brand-500" />
            <p className="text-sm text-grayScale-500">Loading…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-grayScale-100">
              <Bell className="h-7 w-7 text-grayScale-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-grayScale-700">
                Could not load
              </p>
              <p className="mt-1 text-xs text-grayScale-400">
                Content may have been removed.
              </p>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={onRetry}
              >
                Try again
              </Button>
            )}
          </div>
        ) : notification ? (
          <>
            {/* Hero header */}
            <div className="relative px-6 pt-6 pb-4 pr-14">
              <div
                className={cn(
                  "absolute left-6 top-5 h-12 w-12 rounded-2xl opacity-20 blur-xl",
                  config.bg,
                )}
              />
              <div className="relative flex items-start gap-3.5">
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                    config.bg,
                    config.color,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <DialogTitle className="text-base font-bold leading-snug text-grayScale-900">
                    {getNotificationTitle(notification) || "Notification"}
                  </DialogTitle>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-grayScale-400">
                    <span className="capitalize">
                      {notification.delivery_channel}
                    </span>
                    <span className="text-grayScale-200">·</span>
                    <span>
                      {formatNotificationTimestamp(notification.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-grayScale-100 px-6">
              {[
                { key: "details" as const, label: "Details" },
                { key: "preview" as const, label: "Preview" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "relative px-3 pb-2.5 text-xs font-semibold transition-colors",
                    tab === t.key
                      ? "text-brand-600"
                      : "text-grayScale-400 hover:text-grayScale-600",
                  )}
                >
                  {t.label}
                  {tab === t.key && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 pb-8 pt-5">
              {tab === "details" ? (
                <DetailsTab notification={notification} onDelete={onDelete} />
              ) : (
                <PreviewTab
                  notification={notification}
                  config={config}
                  Icon={Icon}
                />
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailsTab({
  notification,
  onDelete,
}: {
  notification: Notification;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Message */}

      {/* Image */}
      {notification.image && (
        <div className="overflow-hidden rounded-xl">
          <img
            src={notification.image}
            alt=""
            className="max-h-48 w-full object-cover"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-0 divide-y divide-grayScale-100">
        {[
          { k: "Type", v: formatNotificationTypeLabel(notification.type) },
          { k: "Channel", v: notification.delivery_channel || "—" },
          { k: "Status", v: notification.is_read ? "Read" : "Unread" },
          { k: "Delivery", v: notification.delivery_status || "—" },
          ...(notification.receiver_type
            ? [{ k: "Receiver", v: notification.receiver_type }]
            : []),
          { k: "Sent", v: formatNotificationDateTime(notification.timestamp) },
          ...(isMeaningfulExpiry(notification.expires)
            ? [
                {
                  k: "Expires",
                  v: formatNotificationDateTime(notification.expires),
                },
              ]
            : []),
        ].map((row) => (
          <div
            key={row.k}
            className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-xs text-grayScale-400">{row.k}</span>
            <span className="text-xs font-medium text-grayScale-600">
              {row.v}
            </span>
          </div>
        ))}
      </div>

      {/* Tags */}
      {notification.payload.tags && notification.payload.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {notification.payload.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      {onDelete && (
        <div className="border-t border-grayScale-100 pt-4">
          <Button
            size="sm"
            className="h-9 rounded-lg bg-destructive px-4 text-xs font-medium text-white hover:bg-destructive/90"
            onClick={onDelete}
          >
            Delete notification
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewTab({
  notification,
  config,
  Icon,
}: {
  notification: Notification;
  config: { bg: string; color: string };
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const title = getNotificationTitle(notification) || "Notification";
  const message = getNotificationMessage(notification) || "";

  return (
    <div className="space-y-4">
      {/* Full content preview */}
      <div className="rounded-xl border border-grayScale-100 bg-grayScale-50/50 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
          Full content
        </p>
        <h3 className="mt-2 text-sm font-semibold text-grayScale-900">
          {title}
        </h3>
        {message ? (
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-grayScale-600">
            {message}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-grayScale-400 italic">
            No message content.
          </p>
        )}

        {notification.payload.tags && notification.payload.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {notification.payload.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
