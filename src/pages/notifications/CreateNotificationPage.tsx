import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, CalendarClock, Mail, MailOpen, Megaphone, Search, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { FileUpload } from "../../components/ui/file-upload"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { NotificationSchedulePicker } from "../../components/notifications/NotificationSchedulePicker"
import { cn } from "../../lib/utils"
import {
  sendBulkEmail,
  sendBulkInApp,
  sendBulkPush,
  sendBulkSms,
} from "../../api/notifications.api"
import {
  extractApiErrorMessage,
  fetchAllPlatformUsers,
  formatScheduledAtLabel,
  IN_APP_LEVELS,
  IN_APP_TYPES,
  parseDirectRecipients,
  PLATFORM_ROLES,
} from "../../lib/notificationBulk"
import type {
  InAppNotificationLevel,
  NotificationChannel,
  PlatformRole,
} from "../../types/notification.types"
import type { UserApiDTO } from "../../types/user.types"

type AudienceMode = "role" | "selected" | "direct"
type SendMode = "now" | "schedule"

const CHANNELS: {
  value: NotificationChannel
  label: string
  icon: typeof Bell
}[] = [
  { value: "push", label: "Push", icon: Bell },
  { value: "sms", label: "SMS", icon: Mail },
  { value: "email", label: "Email", icon: MailOpen },
  { value: "in_app", label: "In-app", icon: Smartphone },
]

export function CreateNotificationPage() {
  const navigate = useNavigate()

  const [channel, setChannel] = useState<NotificationChannel>("push")
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("role")
  const [sendMode, setSendMode] = useState<SendMode>("now")
  const [platformRole, setPlatformRole] = useState<PlatformRole>("STUDENT")
  const [users, setUsers] = useState<UserApiDTO[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [directRecipients, setDirectRecipients] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [inAppType, setInAppType] = useState("system_alert")
  const [inAppLevel, setInAppLevel] = useState<InAppNotificationLevel>("info")
  const [scheduledAt, setScheduledAt] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setRecipientsLoading(true)
    fetchAllPlatformUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setRecipientsLoading(false))
  }, [])

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => {
      const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim().toLowerCase()
      const email = (user.email ?? "").toLowerCase()
      const phone = (user.phone_number ?? "").toLowerCase()
      return fullName.includes(q) || email.includes(q) || phone.includes(q)
    })
  }, [users, userSearchQuery])

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedUserIds.includes(u.id)),
    [users, selectedUserIds],
  )

  const filteredSelectedCount = useMemo(
    () => filteredUsers.filter((u) => selectedUserIds.includes(u.id)).length,
    [filteredUsers, selectedUserIds],
  )

  const needsTitle = channel === "push" || channel === "email" || channel === "in_app"
  const titleLabel =
    channel === "email" ? "Subject" : channel === "sms" ? "Title (optional)" : "Title"
  const supportsDirect = channel === "sms" || channel === "email"
  const supportsAttachment =
    (channel === "email" || channel === "push") && sendMode === "now"
  const isScheduling = sendMode === "schedule"

  const resetForm = () => {
    setTitle("")
    setMessage("")
    setHtmlBody("")
    setAudienceMode("role")
    setPlatformRole("STUDENT")
    setSelectedUserIds([])
    setUserSearchQuery("")
    setDirectRecipients("")
    setScheduledAt("")
    setAttachment(null)
    setSendMode("now")
    setChannel("push")
    setInAppType("system_alert")
    setInAppLevel("info")
  }

  const validateTargeting = (): boolean => {
    if (audienceMode === "role") return true
    if (audienceMode === "selected") {
      if (selectedUserIds.length === 0) {
        toast.error("Select at least one user")
        return false
      }
      return true
    }
    const direct = parseDirectRecipients(directRecipients)
    if (direct.length === 0) {
      toast.error(channel === "sms" ? "Enter at least one phone number" : "Enter at least one email")
      return false
    }
    return true
  }

  const buildTargeting = () => {
    if (audienceMode === "role") {
      return { role: platformRole }
    }
    if (audienceMode === "selected") {
      return { user_ids: selectedUserIds }
    }
    const direct = parseDirectRecipients(directRecipients)
    if (channel === "sms") return { phone_numbers: direct }
    return { emails: direct }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (channel !== "sms" && !title.trim()) {
      toast.error(channel === "email" ? "Subject is required" : "Title is required")
      return
    }
    if (!message.trim() && !(channel === "email" && htmlBody.trim())) {
      toast.error("Message is required")
      return
    }
    if (isScheduling && !scheduledAt) {
      toast.error("Choose a schedule date and time")
      return
    }
    if (!validateTargeting()) return

    const targeting = buildTargeting()
    const schedule = isScheduling && scheduledAt ? { scheduled_at: scheduledAt } : {}

    try {
      setSending(true)
      let result

      if (channel === "sms") {
        result = await sendBulkSms({
          message: message.trim(),
          ...targeting,
          ...schedule,
        } as Parameters<typeof sendBulkSms>[0])
      } else if (channel === "email") {
        const form = new FormData()
        form.append("subject", title.trim())
        if (message.trim()) form.append("message", message.trim())
        if (htmlBody.trim()) form.append("html", htmlBody.trim())
        if ("role" in targeting) form.append("role", targeting.role)
        if ("user_ids" in targeting) {
          form.append("user_ids", JSON.stringify(targeting.user_ids))
        }
        if ("emails" in targeting) {
          form.append("emails", JSON.stringify(targeting.emails))
        }
        if (isScheduling) form.append("scheduled_at", scheduledAt)
        if (attachment) form.append("file", attachment)
        result = await sendBulkEmail(form)
      } else if (channel === "push") {
        const form = new FormData()
        form.append("title", title.trim())
        form.append("message", message.trim())
        if ("role" in targeting) form.append("role", targeting.role)
        if ("user_ids" in targeting) {
          form.append("user_ids", JSON.stringify(targeting.user_ids))
        }
        if (isScheduling) form.append("scheduled_at", scheduledAt)
        if (attachment) form.append("file", attachment)
        result = await sendBulkPush(form)
      } else {
        result = await sendBulkInApp({
          title: title.trim(),
          message: message.trim(),
          type: inAppType,
          level: inAppLevel,
          ...targeting,
          ...schedule,
        } as Parameters<typeof sendBulkInApp>[0])
      }

      if (result.kind === "scheduled") {
        toast.success("Notification scheduled", {
          description: `Job #${result.data.id} · ${new Date(result.data.scheduled_at).toLocaleString()}`,
          action: {
            label: "View scheduled",
            onClick: () => navigate("/notifications/scheduled"),
          },
        })
      } else {
        const { data } = result
        const total =
          data.total_recipients ?? data.target_users ?? data.sent + data.failed
        toast.success("Notification sent", {
          description: `${data.sent} sent · ${data.failed} failed · ${total} recipient${total === 1 ? "" : "s"}`,
        })
      }

      resetForm()
    } catch (err) {
      toast.error("Failed to send notification", {
        description: extractApiErrorMessage(err, "Please try again."),
      })
    } finally {
      setSending(false)
    }
  }

  const previewIcon = CHANNELS.find((c) => c.value === channel)?.icon ?? Bell

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="space-y-2">
        <nav className="flex items-center gap-1 text-xs text-grayScale-400">
          <button
            type="button"
            className="hover:text-grayScale-600"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <span>/</span>
          <button
            type="button"
            className="hover:text-grayScale-600"
            onClick={() => navigate("/notifications")}
          >
            Notifications
          </button>
          <span>/</span>
          <span className="text-grayScale-500">Send</span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-grayScale-400">
              Notifications
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-grayScale-700">
              Send notification
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-500/90 px-2 text-[11px] font-medium text-white">
                <Megaphone className="h-3.5 w-3.5" />
                Composer
              </span>
            </h1>
            <p className="mt-1 text-xs text-grayScale-400">
              Send or schedule bulk SMS, email, push, or in-app notifications.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/notifications/scheduled">Scheduled jobs</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/notifications")}
            >
              Back to inbox
            </Button>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]"
      >
        <div className="space-y-4">
          <Card className="border border-grayScale-100 shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                    Channel
                  </p>
                  <div className="flex flex-wrap gap-1 rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                    {CHANNELS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setChannel(value)
                          if (value !== "sms" && value !== "email" && audienceMode === "direct") {
                            setAudienceMode("role")
                          }
                          if (value === "sms") setTitle("")
                        }}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                          channel === value
                            ? "bg-brand-500 text-white shadow-sm"
                            : "text-grayScale-500 hover:text-grayScale-700",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                    Delivery
                  </p>
                  <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSendMode("now")
                        setScheduledAt("")
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        sendMode === "now"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      Send now
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode("schedule")}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        sendMode === "schedule"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Schedule
                    </button>
                  </div>
                </div>
              </div>

              {isScheduling && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Scheduled at (UTC)
                  </label>
                  <NotificationSchedulePicker value={scheduledAt} onChange={setScheduledAt} />
                  <p className="mt-1 text-[10px] text-grayScale-400">
                    Attachments and push images are not supported for scheduled sends.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {needsTitle && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-500">
                      {titleLabel}
                    </label>
                    <Input
                      placeholder={
                        channel === "email"
                          ? "Email subject line"
                          : "Short headline for this notification"
                      }
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Message
                  </label>
                  <Textarea
                    rows={4}
                    placeholder={
                      channel === "sms"
                        ? "SMS body text."
                        : "Notification body shown to recipients."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                {channel === "email" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-500">
                      HTML body (optional)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="<p>Rich HTML content</p>"
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                    />
                  </div>
                )}
                {channel === "in_app" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-grayScale-500">
                        Type
                      </label>
                      <Select value={inAppType} onChange={(e) => setInAppType(e.target.value)}>
                        {IN_APP_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-grayScale-500">
                        Level
                      </label>
                      <Select
                        value={inAppLevel}
                        onChange={(e) =>
                          setInAppLevel(e.target.value as InAppNotificationLevel)
                        }
                      >
                        {IN_APP_LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {supportsAttachment && (
            <Card className="border border-grayScale-100 shadow-none">
              <CardContent className="space-y-2 p-4">
                <p className="mb-1 block text-xs font-medium text-grayScale-500">
                  {channel === "push" ? "Image (push only)" : "Attachment (email only)"}
                </p>
                <FileUpload
                  accept={channel === "push" ? "image/*" : undefined}
                  onFileSelect={setAttachment}
                  label={channel === "push" ? "Upload notification image" : "Upload attachment"}
                  description={
                    channel === "push"
                      ? "Shown with push notification where supported"
                      : "Optional file attached to the email"
                  }
                  className="min-h-[110px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-grayScale-400">
              {isScheduling
                ? "Creates a scheduled job processed by the backend worker."
                : "Delivers immediately with sent/failed counts returned."}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={sending}>
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  sending ||
                  (!message.trim() && !(channel === "email" && htmlBody.trim()))
                }
              >
                {sending ? (
                  <>
                    <SpinnerIcon className="mr-2 h-3.5 w-3.5" alt="" />
                    {isScheduling ? "Scheduling…" : "Sending…"}
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-3.5 w-3.5" />
                    {isScheduling ? "Schedule notification" : "Send notification"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border border-grayScale-100 shadow-none">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs font-semibold text-grayScale-600">Audience</p>
              <div className="inline-flex flex-wrap gap-1 rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAudienceMode("role")}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition-colors",
                    audienceMode === "role"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-grayScale-500 hover:text-grayScale-700",
                  )}
                >
                  By role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudienceMode("selected")
                    setUserSearchQuery("")
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition-colors",
                    audienceMode === "selected"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-grayScale-500 hover:text-grayScale-700",
                  )}
                >
                  Selected users
                </button>
                {supportsDirect && (
                  <button
                    type="button"
                    onClick={() => setAudienceMode("direct")}
                    className={cn(
                      "rounded-full px-3 py-1.5 transition-colors",
                      audienceMode === "direct"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-grayScale-500 hover:text-grayScale-700",
                    )}
                  >
                    Direct {channel === "sms" ? "phones" : "emails"}
                  </button>
                )}
              </div>

              {audienceMode === "role" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Platform role
                  </label>
                  <Select
                    value={platformRole}
                    onChange={(e) => setPlatformRole(e.target.value as PlatformRole)}
                  >
                    {PLATFORM_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-[10px] text-grayScale-400">
                    Sends to all users with this platform role.
                  </p>
                </div>
              )}

              {audienceMode === "direct" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    {channel === "sms" ? "Phone numbers" : "Email addresses"}
                  </label>
                  <Textarea
                    rows={4}
                    placeholder={
                      channel === "sms"
                        ? "+251911000000\n+251922000000"
                        : "user@example.com\nadmin@example.com"
                    }
                    value={directRecipients}
                    onChange={(e) => setDirectRecipients(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-grayScale-400">
                    One per line or comma-separated.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {audienceMode === "selected" && (
            <Card className="border border-grayScale-100 shadow-none">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-grayScale-600">Selected users</p>
                  <span className="text-[10px] text-grayScale-400">
                    {selectedUsers.length} selected
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-grayScale-100 bg-grayScale-50/60">
                  <div className="sticky top-0 z-10 space-y-2 border-b border-grayScale-100 bg-grayScale-50/95 p-2 backdrop-blur-sm">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grayScale-400" />
                      <Input
                        type="search"
                        placeholder="Search by name, email, or phone…"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="h-8 border-grayScale-200 bg-white pl-8 text-xs"
                        disabled={recipientsLoading}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={recipientsLoading || filteredUsers.length === 0}
                        onClick={() => {
                          const ids = filteredUsers.map((u) => u.id)
                          setSelectedUserIds((prev) => [...new Set([...prev, ...ids])])
                        }}
                        className="text-[11px] font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Select all
                      </button>
                      <span className="text-grayScale-300">·</span>
                      <button
                        type="button"
                        disabled={recipientsLoading || filteredSelectedCount === 0}
                        onClick={() => {
                          const filteredIds = new Set(filteredUsers.map((u) => u.id))
                          setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.has(id)))
                        }}
                        className="text-[11px] font-medium text-grayScale-500 hover:text-grayScale-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Unselect all
                      </button>
                      {userSearchQuery.trim() && filteredUsers.length > 0 && (
                        <span className="ml-auto text-[10px] text-grayScale-400">
                          {filteredUsers.length} shown
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto p-2">
                    {recipientsLoading && (
                      <div className="flex items-center justify-center py-6 text-xs text-grayScale-400">
                        <SpinnerIcon className="mr-2 h-4 w-4" alt="" />
                        Loading users…
                      </div>
                    )}
                    {!recipientsLoading && users.length === 0 && (
                      <div className="py-4 text-center text-xs text-grayScale-400">
                        No users available to select.
                      </div>
                    )}
                    {!recipientsLoading && users.length > 0 && filteredUsers.length === 0 && (
                      <div className="py-4 text-center text-xs text-grayScale-400">
                        No users match &ldquo;{userSearchQuery.trim()}&rdquo;.
                      </div>
                    )}
                    {!recipientsLoading &&
                      filteredUsers.map((user) => {
                        const checked = selectedUserIds.includes(user.id)
                        return (
                          <label
                            key={user.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs",
                              checked ? "bg-brand-50 text-brand-700" : "hover:bg-grayScale-100",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-grayScale-300"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedUserIds((prev) =>
                                  e.target.checked
                                    ? [...prev, user.id]
                                    : prev.filter((id) => id !== user.id),
                                )
                              }}
                            />
                            <span className="truncate">
                              {user.first_name} {user.last_name}
                              <span className="ml-1 text-[10px] text-grayScale-400">
                                · {user.email ?? user.phone_number ?? `ID ${user.id}`}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border border-dashed border-grayScale-200 bg-grayScale-50/40 shadow-none">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold text-grayScale-600">Preview</p>
              <div className="space-y-1 rounded-xl border border-grayScale-200 bg-white p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/90 text-white">
                    {(() => {
                      const Icon = previewIcon
                      return <Icon className="h-3.5 w-3.5" />
                    })()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-grayScale-800">
                      {title || (channel === "sms" ? "SMS message" : "Notification title")}
                    </p>
                    <p className="truncate text-[11px] text-grayScale-500">
                      {message || "Message preview will appear here."}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-grayScale-400">
                Channel: {channel.toUpperCase().replace("_", "-")}
                {isScheduling && scheduledAt
                  ? ` · Scheduled ${formatScheduledAtLabel(scheduledAt)}`
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
