import { Link } from "react-router-dom"
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Send,
  XCircle,
  Smartphone,
} from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { channelLabel, formatScheduledAtLabel } from "../../../lib/notificationBulk"
import { cn } from "../../../lib/utils"
import type { NotificationChannel } from "../../../types/notification.types"
import { UnassignedLabel } from "../../../lib/displayValue"

export type BulkSendSummary =
  | {
      kind: "immediate"
      channel: NotificationChannel
      audienceLabel: string
      titlePreview: string
      messagePreview: string
      sent: number
      failed: number
      total: number
      targetUsers?: number
      devicesTargeted?: number
      pushImage?: string
      completedAt: string
      apiMessage?: string
    }
  | {
      kind: "scheduled"
      channel: NotificationChannel
      audienceLabel: string
      titlePreview: string
      messagePreview: string
      jobId: number
      scheduledAt: string
      status?: string
      emailTemplateSlug?: string
      completedAt: string
      apiMessage?: string
    }

interface BulkSendSummaryPanelProps {
  summary: BulkSendSummary
  onDismiss: () => void
}

function StatBlock({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number | string
  tone?: "default" | "success" | "danger" | "muted"
}) {
  const valueClass =
    tone === "success"
      ? "text-mint-600"
      : tone === "danger"
        ? "text-destructive"
        : tone === "muted"
          ? "text-grayScale-500"
          : "text-grayScale-800"

  return (
    <div className="rounded-lg border border-grayScale-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">
        {label}
      </p>
      <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", valueClass)}>{value}</p>
    </div>
  )
}

export function BulkSendSummaryPanel({ summary, onDismiss }: BulkSendSummaryPanelProps) {
  const isImmediate = summary.kind === "immediate"
  const isPush = summary.channel === "push"
  const hasFailures = isImmediate && summary.failed > 0
  const allFailed = isImmediate && summary.sent === 0 && summary.failed > 0

  const borderTone = allFailed
    ? "border-destructive/30 bg-destructive/5"
    : hasFailures
      ? "border-gold-300/60 bg-gold-50/50"
      : "border-mint-300/60 bg-mint-50/40"

  const StatusIcon = allFailed ? XCircle : hasFailures ? AlertTriangle : CheckCircle2
  const statusIconClass = allFailed
    ? "text-destructive"
    : hasFailures
      ? "text-gold-600"
      : "text-mint-600"

  const headline = isImmediate
    ? allFailed
      ? "Delivery failed"
      : hasFailures
        ? "Sent with some failures"
        : "Notification sent successfully"
    : "Notification scheduled"

  const completedLabel = new Date(summary.completedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const progressTotal = isImmediate ? Math.max(summary.total, 1) : 1

  return (
    <Card className={cn("border shadow-sm", borderTone)}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm",
                statusIconClass,
              )}
            >
              <StatusIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-grayScale-800">{headline}</h2>
                <Badge variant={isImmediate ? (hasFailures ? "warning" : "success") : "info"}>
                  {isImmediate ? "Delivered" : "Scheduled"}
                </Badge>
                <Badge variant="secondary">{channelLabel(summary.channel)}</Badge>
                {!isImmediate && summary.status ? (
                  <Badge variant="secondary">{summary.status}</Badge>
                ) : null}
              </div>
              <p className="text-xs text-grayScale-500">
                {isImmediate
                  ? `Completed at ${completedLabel}`
                  : `Scheduled for ${formatScheduledAtLabel(summary.scheduledAt)} · created ${completedLabel}`}
              </p>
              {summary.apiMessage ? (
                <p className="text-xs text-grayScale-600">{summary.apiMessage}</p>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-grayScale-400 hover:text-grayScale-700"
            onClick={onDismiss}
            aria-label="Dismiss summary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-grayScale-100 bg-white/80 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">
              <Users className="h-3 w-3" />
              Audience
            </p>
            <p className="mt-1 text-sm font-medium text-grayScale-800">{summary.audienceLabel}</p>
          </div>
          <div className="rounded-lg border border-grayScale-100 bg-white/80 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">
              <Send className="h-3 w-3" />
              Content
            </p>
            <p className="mt-1 truncate text-sm font-medium text-grayScale-800">
              {summary.titlePreview || <UnassignedLabel />}
            </p>
            <p className="truncate text-xs text-grayScale-500">{summary.messagePreview || <UnassignedLabel />}</p>
            {!isImmediate && summary.emailTemplateSlug ? (
              <p className="mt-1 text-[10px] text-grayScale-400">
                Template: {summary.emailTemplateSlug}
              </p>
            ) : null}
          </div>
        </div>

        {isImmediate ? (
          <>
            {isPush ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatBlock label="Target users" value={summary.targetUsers ?? 0} />
                <StatBlock
                  label="Devices targeted"
                  value={summary.devicesTargeted ?? 0}
                />
                <StatBlock label="Devices sent" value={summary.sent} tone="success" />
                <StatBlock
                  label="Devices failed"
                  value={summary.failed}
                  tone={summary.failed > 0 ? "danger" : "muted"}
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <StatBlock label="Total recipients" value={summary.total} />
                <StatBlock label="Sent" value={summary.sent} tone="success" />
                <StatBlock
                  label="Failed"
                  value={summary.failed}
                  tone={summary.failed > 0 ? "danger" : "muted"}
                />
              </div>
            )}
            {summary.total > 0 ? (
              <div className="space-y-1">
                <div className="flex h-2 overflow-hidden rounded-full bg-grayScale-100">
                  {summary.sent > 0 ? (
                    <div
                      className="bg-mint-500 transition-all"
                      style={{ width: `${(summary.sent / progressTotal) * 100}%` }}
                    />
                  ) : null}
                  {summary.failed > 0 ? (
                    <div
                      className="bg-destructive transition-all"
                      style={{ width: `${(summary.failed / progressTotal) * 100}%` }}
                    />
                  ) : null}
                </div>
                <p className="text-[10px] text-grayScale-400">
                  {isPush
                    ? `${summary.sent} of ${summary.devicesTargeted ?? summary.total} device deliveries succeeded`
                    : `${summary.sent} of ${summary.total} delivered`}
                  {summary.failed > 0 ? ` · ${summary.failed} failed` : ""}
                </p>
              </div>
            ) : null}
            {isPush && summary.pushImage ? (
              <p className="truncate text-[10px] text-grayScale-400">
                Image: {summary.pushImage}
              </p>
            ) : null}
            {isPush &&
            (summary.devicesTargeted ?? 0) === 0 &&
            (summary.targetUsers ?? 0) > 0 ? (
              <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Targeted users have no active FCM device tokens. They must register a device
                from the learner app while logged in.
              </p>
            ) : null}
          </>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <StatBlock label="Job ID" value={`#${summary.jobId}`} />
            <div className="rounded-lg border border-grayScale-100 bg-white px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">
                <CalendarClock className="h-3 w-3" />
                Scheduled at
              </p>
              <p className="mt-0.5 text-sm font-semibold text-grayScale-800">
                {formatScheduledAtLabel(summary.scheduledAt)}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-grayScale-100/80 pt-3">
          <p className="text-[11px] text-grayScale-400">
            This summary is temporary and clears when you dismiss it or send again.
          </p>
          <div className="flex flex-wrap gap-2">
            {!isImmediate ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/notifications/scheduled">View scheduled jobs</Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
