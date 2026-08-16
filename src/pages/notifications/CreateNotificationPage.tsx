import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Mail, MailOpen, Megaphone, Search, Smartphone, Users } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { FileUpload } from "../../components/ui/file-upload"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { NotificationSchedulePicker } from "../../components/notifications/NotificationSchedulePicker"
import { EmailComposeFields } from "../../components/notifications/EmailComposeFields"
import { cn } from "../../lib/utils"
import { SearchHighlight, getSearchTokens } from "../../components/SearchHighlight"
import { Stepper } from "../../components/ui/stepper"
import {
  sendBulkEmail,
  sendBulkInApp,
  sendBulkPush,
  sendBulkSms,
} from "../../api/notifications.api"
import {
  appendBulkEmailContentToForm,
  fetchActiveOutboundEmailTemplates,
  validateEmailComposeInput,
} from "../../lib/notificationEmailCompose"
import {
  fetchAllPlatformUsersMatching,
  fetchAllTeamMembers,
  formatScheduledAtLabel,
  IN_APP_LEVELS,
  IN_APP_TYPES,
  isAudienceModeValidForChannel,
  parseDirectRecipients,
  type NotificationAudienceMode,
} from "../../lib/notificationBulk"
import {
  EMPTY_PLATFORM_AUDIENCE_FILTERS,
  type PlatformAudienceFilters,
} from "../../lib/platformAudienceFilters"
import { PlatformAudienceFilterPanel } from "../../components/notifications/PlatformAudienceFilterPanel"
import { formatAppDateTime } from "../../lib/datetime"
import {
  BulkSendSummaryPanel,
  type BulkSendSummary,
} from "./components/BulkSendSummaryPanel"
import type {
  InAppNotificationLevel,
  NotificationChannel,
} from "../../types/notification.types"
import type { EmailTemplate } from "../../types/emailTemplate.types"
import type { UserApiDTO } from "../../types/user.types"
import type { TeamMember } from "../../types/team.types"

type SendMode = "now" | "schedule"

const NOTIFICATION_STEPS = ["Channel", "Content", "Audience", "Preview"]

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

function buildAudienceLabel(
  audienceMode: NotificationAudienceMode,
  selectedUserIds: number[],
  selectedTeamMemberIds: number[],
  directRecipients: string,
  channel: NotificationChannel,
): string {
  if (audienceMode === "platform_selected") {
    const count = selectedUserIds.length
    return `${count} selected platform user${count === 1 ? "" : "s"}`
  }
  if (audienceMode === "team_selected") {
    const count = selectedTeamMemberIds.length
    return `${count} selected team member${count === 1 ? "" : "s"}`
  }
  const direct = parseDirectRecipients(directRecipients)
  const noun = channel === "sms" ? "phone number" : "email address"
  return `${direct.length} direct ${noun}${direct.length === 1 ? "" : "s"}`
}

function buildContentPreview(
  channel: NotificationChannel,
  title: string,
  message: string,
  emailTemplateSlug: string,
  htmlBody: string,
): { titlePreview: string; messagePreview: string } {
  if (channel === "email" && emailTemplateSlug) {
    return {
      titlePreview: title.trim() || `Template: ${emailTemplateSlug}`,
      messagePreview: message.trim() || `Using template "${emailTemplateSlug}"`,
    }
  }
  if (channel === "email") {
    return {
      titlePreview: title.trim() || "Email",
      messagePreview:
        htmlBody.trim() ||
        message.trim() ||
        "Free-form email (no template)",
    }
  }
  if (channel === "sms") {
    return {
      titlePreview: title.trim() || "SMS",
      messagePreview: message.trim(),
    }
  }
  return {
    titlePreview: title.trim(),
    messagePreview: message.trim(),
  }
}

export function CreateNotificationPage() {
  const navigate = useNavigate()

  const [channel, setChannel] = useState<NotificationChannel>("push")
  const [audienceMode, setAudienceMode] = useState<NotificationAudienceMode>("platform_selected")
  const [sendMode, setSendMode] = useState<SendMode>("now")
  const [users, setUsers] = useState<UserApiDTO[]>([])
  const [platformFilters, setPlatformFilters] = useState<PlatformAudienceFilters>(
    EMPTY_PLATFORM_AUDIENCE_FILTERS,
  )
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [teamRecipientsLoading, setTeamRecipientsLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<number[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [teamSearchQuery, setTeamSearchQuery] = useState("")
  const [directRecipients, setDirectRecipients] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [inAppType, setInAppType] = useState("system_alert")
  const [inAppLevel, setInAppLevel] = useState<InAppNotificationLevel>("info")
  const [scheduledAt, setScheduledAt] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [emailTemplateSlug, setEmailTemplateSlug] = useState("")
  const [emailTemplateVariables, setEmailTemplateVariables] = useState<Record<string, string>>({})
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)
  const [sendSummary, setSendSummary] = useState<BulkSendSummary | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (audienceMode !== "platform_selected") return
    let cancelled = false
    setRecipientsLoading(true)
    fetchAllPlatformUsersMatching(platformFilters)
      .then((nextUsers) => {
        if (!cancelled) setUsers(nextUsers)
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
      .finally(() => {
        if (!cancelled) setRecipientsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [audienceMode, platformFilters])

  useEffect(() => {
    if (channel !== "email" && channel !== "in_app") {
      setTeamMembers([])
      return
    }
    let cancelled = false
    setTeamRecipientsLoading(true)
    fetchAllTeamMembers()
      .then((members) => {
        if (!cancelled) setTeamMembers(members)
      })
      .catch(() => {
        if (!cancelled) setTeamMembers([])
      })
      .finally(() => {
        if (!cancelled) setTeamRecipientsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [channel])

  useEffect(() => {
    if (channel !== "email") {
      setEmailTemplateSlug("")
      setEmailTemplateVariables({})
      return
    }
    let cancelled = false
    setEmailTemplatesLoading(true)
    fetchActiveOutboundEmailTemplates()
      .then((templates) => {
        if (!cancelled) setEmailTemplates(templates)
      })
      .catch(() => {
        if (!cancelled) setEmailTemplates([])
      })
      .finally(() => {
        if (!cancelled) setEmailTemplatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [channel])

  const filteredUsers = useMemo(() => {
    const tokens = getSearchTokens(userSearchQuery).map((token) => token.toLowerCase())
    if (tokens.length === 0) return users
    return users.filter((user) => {
      const haystack = [
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        user.email ?? "",
        user.phone_number ?? "",
        String(user.id),
      ]
        .join(" ")
        .toLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })
  }, [users, userSearchQuery])

  const filteredSelectedCount = useMemo(
    () => filteredUsers.filter((u) => selectedUserIds.includes(u.id)).length,
    [filteredUsers, selectedUserIds],
  )

  const filteredTeamMembers = useMemo(() => {
    const tokens = getSearchTokens(teamSearchQuery).map((token) => token.toLowerCase())
    if (tokens.length === 0) return teamMembers
    return teamMembers.filter((member) => {
      const haystack = [
        `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim(),
        member.email ?? "",
        String(member.id),
      ]
        .join(" ")
        .toLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })
  }, [teamMembers, teamSearchQuery])

  const filteredSelectedTeamCount = useMemo(
    () => filteredTeamMembers.filter((m) => selectedTeamMemberIds.includes(m.id)).length,
    [filteredTeamMembers, selectedTeamMemberIds],
  )

  const supportsTeamTargeting = channel === "email" || channel === "in_app"

  const needsTitle = channel === "push" || channel === "in_app" || (channel === "email" && !emailTemplateSlug)
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
    setAudienceMode("platform_selected")
    setSelectedUserIds([])
    setSelectedTeamMemberIds([])
    setUserSearchQuery("")
    setPlatformFilters(EMPTY_PLATFORM_AUDIENCE_FILTERS)
    setTeamSearchQuery("")
    setDirectRecipients("")
    setScheduledAt("")
    setAttachment(null)
    setSendMode("now")
    setChannel("push")
    setInAppType("system_alert")
    setInAppLevel("info")
    setEmailTemplateSlug("")
    setEmailTemplateVariables({})
    setCurrentStep(1)
    setSendSummary(null)
  }

  const selectedEmailTemplate = useMemo(
    () => emailTemplates.find((t) => t.slug === emailTemplateSlug) ?? null,
    [emailTemplates, emailTemplateSlug],
  )

  const emailContentReady = useMemo(() => {
    if (channel !== "email") return true
    const error = validateEmailComposeInput({
      templateSlug: emailTemplateSlug,
      subject: title,
      message,
      htmlBody,
      template: selectedEmailTemplate,
      templateVariables: emailTemplateVariables,
    })
    return error === null
  }, [
    channel,
    emailTemplateSlug,
    title,
    message,
    htmlBody,
    selectedEmailTemplate,
    emailTemplateVariables,
  ])

  const validateTargeting = useCallback((): boolean => {
    if (audienceMode === "platform_selected") {
      if (selectedUserIds.length === 0) {
        toast.error("Select at least one platform user")
        return false
      }
      return true
    }
    if (audienceMode === "team_selected") {
      if (selectedTeamMemberIds.length === 0) {
        toast.error("Select at least one team member")
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
  }, [audienceMode, selectedUserIds, selectedTeamMemberIds, directRecipients, channel])

  const validateStep = useCallback(
    (step: number): boolean => {
      if (step === 2) {
        if (channel === "email") {
          const emailError = validateEmailComposeInput({
            templateSlug: emailTemplateSlug,
            subject: title,
            message,
            htmlBody,
            template: selectedEmailTemplate,
            templateVariables: emailTemplateVariables,
          })
          if (emailError) {
            toast.error(emailError)
            return false
          }
        } else if (channel !== "sms" && !title.trim()) {
          toast.error("Title is required")
          return false
        }
        if (channel !== "email" && !message.trim()) {
          toast.error("Message is required")
          return false
        }
        if (isScheduling && !scheduledAt) {
          toast.error("Choose a schedule date and time")
          return false
        }
      }
      if (step === 3) {
        return validateTargeting()
      }
      return true
    },
    [
      channel,
      title,
      message,
      htmlBody,
      emailTemplateSlug,
      emailTemplateVariables,
      selectedEmailTemplate,
      isScheduling,
      scheduledAt,
      validateTargeting,
    ],
  )

  const goNext = useCallback(() => {
    if (!validateStep(currentStep)) return
    setCurrentStep((s) => Math.min(s + 1, 4))
  }, [currentStep, validateStep])

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }, [])

  const buildTargeting = () => {
    if (audienceMode === "platform_selected") {
      return { user_ids: selectedUserIds }
    }
    if (audienceMode === "team_selected") {
      return { team_member_ids: selectedTeamMemberIds }
    }
    const direct = parseDirectRecipients(directRecipients)
    if (channel === "sms") return { phone_numbers: direct }
    return { emails: direct }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (channel === "email") {
      const emailError = validateEmailComposeInput({
        templateSlug: emailTemplateSlug,
        subject: title,
        message,
        htmlBody,
        template: selectedEmailTemplate,
        templateVariables: emailTemplateVariables,
      })
      if (emailError) {
        toast.error(emailError)
        return
      }
    } else if (channel !== "sms" && !title.trim()) {
      toast.error("Title is required")
      return
    }

    if (channel !== "email" && !message.trim()) {
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
    const audienceLabel = buildAudienceLabel(
      audienceMode,
      selectedUserIds,
      selectedTeamMemberIds,
      directRecipients,
      channel,
    )
    const contentPreview = buildContentPreview(
      channel,
      title,
      message,
      emailTemplateSlug,
      htmlBody,
    )

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
        appendBulkEmailContentToForm(form, {
          templateSlug: emailTemplateSlug,
          subject: title,
          message,
          htmlBody,
          templateVariables: emailTemplateVariables,
        })
        if ("role" in targeting) form.append("role", targeting.role)
        if ("user_ids" in targeting) {
          form.append("user_ids", JSON.stringify(targeting.user_ids))
        }
        if ("team_member_ids" in targeting) {
          form.append("team_member_ids", JSON.stringify(targeting.team_member_ids))
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

      const completedAt = new Date().toISOString()

      if (result.kind === "scheduled") {
        setSendSummary({
          kind: "scheduled",
          channel,
          audienceLabel,
          titlePreview: contentPreview.titlePreview,
          messagePreview: contentPreview.messagePreview,
          jobId: result.data.id,
          scheduledAt: result.data.scheduled_at,
          status: result.data.status,
          emailTemplateSlug: result.data.email_template_slug,
          completedAt,
          apiMessage: result.message || undefined,
        })
        toast.success("Notification scheduled", {
          description: `Job #${result.data.id} · ${formatAppDateTime(result.data.scheduled_at)}`,
          action: {
            label: "View scheduled",
            onClick: () => navigate("/notifications/scheduled"),
          },
        })
      } else {
        const { data } = result
        const total =
          channel === "push"
            ? (data.devices_targeted ?? data.target_users ?? data.sent + data.failed)
            : (data.total_recipients ?? data.target_users ?? data.sent + data.failed)
        setSendSummary({
          kind: "immediate",
          channel,
          audienceLabel,
          titlePreview: contentPreview.titlePreview,
          messagePreview: contentPreview.messagePreview,
          sent: data.sent,
          failed: data.failed,
          total,
          targetUsers: data.target_users,
          devicesTargeted: data.devices_targeted,
          pushImage: data.image,
          completedAt,
          apiMessage: result.message || undefined,
        })
        const toastDetail =
          channel === "push"
            ? `${data.sent} devices sent · ${data.failed} failed · ${data.target_users ?? 0} users`
            : `${data.sent} sent · ${data.failed} failed · ${total} recipient${total === 1 ? "" : "s"}`
        toast.success("Notification sent", {
          description: toastDetail,
        })
      }
    } catch (err) {
      notifyApiError(err, "Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  const activeStep = currentStep
  const isLastStep = currentStep === 4

  const previewIcon = CHANNELS.find((c) => c.value === channel)?.icon ?? Bell

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-grayScale-900">
                Send notification
              </h1>
              <p className="mt-0.5 text-xs text-grayScale-400">
                Send or schedule bulk SMS, email, push, or in-app notifications.
              </p>
            </div>
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

      {sendSummary ? (
        <BulkSendSummaryPanel summary={sendSummary} onDismiss={() => setSendSummary(null)} />
      ) : null}

      <div className="rounded-2xl border border-grayScale-100 bg-white px-6 py-5 shadow-sm">
        <Stepper steps={NOTIFICATION_STEPS} currentStep={activeStep} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!isLastStep) {
            goNext()
            return
          }
          void handleSubmit(e)
        }}
        className="space-y-5"
      >
        {/* Step 1: Channel & Delivery */}
        {currentStep === 1 && (
          <div className="rounded-2xl border border-grayScale-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">1</span>
              <p className="text-sm font-semibold text-grayScale-800">Channel & delivery</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Channel
                </label>
                <div className="relative">
                  <select
                    value={channel}
                    onChange={(e) => {
                      const v = e.target.value as NotificationChannel
                      setChannel(v)
                      if (!isAudienceModeValidForChannel(audienceMode, v)) {
                        setAudienceMode("platform_selected")
                      }
                      if (v === "sms") setTitle("")
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-grayScale-200 bg-white pl-3 pr-9 text-sm font-medium text-grayScale-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Delivery
                </label>
                <div className="relative">
                  <select
                    value={sendMode}
                    onChange={(e) => {
                      const v = e.target.value as SendMode
                      setSendMode(v)
                      if (v === "now") setScheduledAt("")
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-grayScale-200 bg-white pl-3 pr-9 text-sm font-medium text-grayScale-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="now">Send now</option>
                    <option value="schedule">Schedule</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>
            </div>

            {isScheduling && (
              <div className="mt-4 border-t border-grayScale-100 pt-4">
                <label className="mb-1 block text-xs font-medium text-grayScale-500">
                  Scheduled at (UTC)
                </label>
                <NotificationSchedulePicker value={scheduledAt} onChange={setScheduledAt} />
                <p className="mt-1 text-[10px] text-grayScale-400">
                  Attachments and push images are not supported for scheduled sends.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Content */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-grayScale-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">2</span>
              <p className="text-sm font-semibold text-grayScale-800">Content</p>
            </div>
            <div className="space-y-3">
              {channel === "email" ? (
                <EmailComposeFields
                  templates={emailTemplates}
                  templatesLoading={emailTemplatesLoading}
                  subject={title}
                  message={message}
                  htmlBody={htmlBody}
                  templateSlug={emailTemplateSlug}
                  templateVariables={emailTemplateVariables}
                  onSubjectChange={setTitle}
                  onMessageChange={setMessage}
                  onHtmlBodyChange={setHtmlBody}
                  onTemplateSlugChange={setEmailTemplateSlug}
                  onTemplateVariablesChange={setEmailTemplateVariables}
                />
              ) : (
                <>
                  {needsTitle && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-grayScale-500">
                        {titleLabel}
                      </label>
                      <Input
                        placeholder={
                          channel === "sms"
                            ? "Optional headline"
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
                </>
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

            {supportsAttachment && (
              <div className="mt-4 border-t border-grayScale-100 pt-4">
                <p className="mb-2 block text-xs font-medium text-grayScale-500">
                  {channel === "push" ? "Image (push only)" : "Attachment (email only)"}
                </p>
                <FileUpload
                  value={attachment}
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
              </div>
            )}
          </div>
        )}

        {/* Step 3: Audience */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-grayScale-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">3</span>
              <p className="text-sm font-semibold text-grayScale-800">Audience</p>
            </div>
            <div className="space-y-4">

          <Card
              className={cn(
                "border shadow-none",
                audienceMode === "platform_selected" ||
                  audienceMode === "direct"
                  ? "border-brand-200 ring-1 ring-brand-100"
                  : "border-grayScale-100",
              )}
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-100/60 text-brand-600">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-grayScale-700">Platform recipients</p>
                    <p className="text-[10px] text-grayScale-400">Learners and platform users</p>
                  </div>
                </div>
                <div className="inline-flex flex-wrap gap-1.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceMode("platform_selected")
                      setUserSearchQuery("")
                    }}
                    className={cn(
                      "rounded-[6px] px-3 py-2 transition-all",
                      audienceMode === "platform_selected"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "border border-grayScale-200 bg-white text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700",
                    )}
                  >
                    Platform users
                  </button>
                  {supportsDirect && (
                    <button
                      type="button"
                      onClick={() => setAudienceMode("direct")}
                      className={cn(
                        "rounded-[6px] px-3 py-2 transition-all",
                        audienceMode === "direct"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "border border-grayScale-200 bg-white text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700",
                      )}
                    >
                      Direct {channel === "sms" ? "phones" : "emails"}
                    </button>
                  )}
                </div>

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

                {audienceMode === "platform_selected" && (
                  <div className="space-y-3">
                    <PlatformAudienceFilterPanel
                      filters={platformFilters}
                      onChange={setPlatformFilters}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-grayScale-500">Select users</p>
                      <span className="text-[10px] text-grayScale-400">
                        {selectedUserIds.length} selected
                        {users.length > 0 ? ` · ${users.length} loaded` : ""}
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
                      <div className="flex flex-wrap items-center gap-2">
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
                          No users match the current filters.
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
                                <SearchHighlight
                                  text={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()}
                                  query={userSearchQuery}
                                />
                                <span className="ml-1 text-[10px] text-grayScale-400">
                                  ·{" "}
                                  <SearchHighlight
                                    text={user.email ?? user.phone_number ?? `ID ${user.id}`}
                                    query={userSearchQuery}
                                  />
                                </span>
                              </span>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {supportsTeamTargeting && (
              <Card
                className={cn(
                  "border shadow-none",
                  audienceMode === "team_selected"
                    ? "border-brand-200 ring-1 ring-brand-100"
                    : "border-grayScale-100",
                )}
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-100/60 text-brand-600">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-grayScale-700">Team recipients</p>
                      <p className="text-[10px] text-grayScale-400">Staff and team members</p>
                    </div>
                  </div>
                  <div className="inline-flex flex-wrap gap-1.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setAudienceMode("team_selected")
                        setTeamSearchQuery("")
                      }}
                      className={cn(
                        "rounded-[6px] px-3 py-2 transition-all",
                        audienceMode === "team_selected"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "border border-grayScale-200 bg-white text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700",
                      )}
                    >
                      Team members
                    </button>
                  </div>

                  {audienceMode === "team_selected" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-grayScale-500">Select team members</p>
                        <span className="text-[10px] text-grayScale-400">
                          {selectedTeamMemberIds.length} selected
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-grayScale-100 bg-grayScale-50/60">
                    <div className="sticky top-0 z-10 space-y-2 border-b border-grayScale-100 bg-grayScale-50/95 p-2 backdrop-blur-sm">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grayScale-400" />
                        <Input
                          type="search"
                          placeholder="Search by name or email…"
                          value={teamSearchQuery}
                          onChange={(e) => setTeamSearchQuery(e.target.value)}
                          className="h-8 border-grayScale-200 bg-white pl-8 text-xs"
                          disabled={teamRecipientsLoading}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={teamRecipientsLoading || filteredTeamMembers.length === 0}
                          onClick={() => {
                            const ids = filteredTeamMembers.map((m) => m.id)
                            setSelectedTeamMemberIds((prev) => [...new Set([...prev, ...ids])])
                          }}
                          className="text-[11px] font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Select all
                        </button>
                        <span className="text-grayScale-300">·</span>
                        <button
                          type="button"
                          disabled={teamRecipientsLoading || filteredSelectedTeamCount === 0}
                          onClick={() => {
                            const filteredIds = new Set(filteredTeamMembers.map((m) => m.id))
                            setSelectedTeamMemberIds((prev) =>
                              prev.filter((id) => !filteredIds.has(id)),
                            )
                          }}
                          className="text-[11px] font-medium text-grayScale-500 hover:text-grayScale-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Unselect all
                        </button>
                        {teamSearchQuery.trim() && filteredTeamMembers.length > 0 && (
                          <span className="ml-auto text-[10px] text-grayScale-400">
                            {filteredTeamMembers.length} shown
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 space-y-1.5 overflow-y-auto p-2">
                      {teamRecipientsLoading && (
                        <div className="flex items-center justify-center py-6 text-xs text-grayScale-400">
                          <SpinnerIcon className="mr-2 h-4 w-4" alt="" />
                          Loading team members…
                        </div>
                      )}
                      {!teamRecipientsLoading && teamMembers.length === 0 && (
                        <div className="py-4 text-center text-xs text-grayScale-400">
                          No team members available to select.
                        </div>
                      )}
                      {!teamRecipientsLoading &&
                        teamMembers.length > 0 &&
                        filteredTeamMembers.length === 0 && (
                          <div className="py-4 text-center text-xs text-grayScale-400">
                            No team members match &ldquo;{teamSearchQuery.trim()}&rdquo;.
                          </div>
                        )}
                      {!teamRecipientsLoading &&
                        filteredTeamMembers.map((member) => {
                          const checked = selectedTeamMemberIds.includes(member.id)
                          return (
                            <label
                              key={member.id}
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
                                  if (e.target.checked) {
                                    setAudienceMode("team_selected")
                                  }
                                  setSelectedTeamMemberIds((prev) =>
                                    e.target.checked
                                      ? [...prev, member.id]
                                      : prev.filter((id) => id !== member.id),
                                  )
                                }}
                              />
                              <span className="truncate">
                                <SearchHighlight
                                  text={`${member.first_name ?? ""} ${member.last_name ?? ""}`.trim()}
                                  query={teamSearchQuery}
                                />
                                <span className="ml-1 text-[10px] text-grayScale-400">
                                  ·{" "}
                                  <SearchHighlight
                                    text={member.email ?? `ID ${member.id}`}
                                    query={teamSearchQuery}
                                  />
                                </span>
                              </span>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 4 && (
          <div className="rounded-2xl border border-grayScale-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">4</span>
              <p className="text-sm font-semibold text-grayScale-800">Preview</p>
            </div>
            <div className="space-y-1 rounded-xl border border-grayScale-200 bg-grayScale-50/50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/90 text-white">
                  {(() => {
                    const Icon = previewIcon
                    return <Icon className="h-3.5 w-3.5" />
                  })()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-grayScale-800">
                    {title ||
                      (channel === "sms"
                        ? "SMS message"
                        : channel === "email" && emailTemplateSlug
                          ? `Template: ${emailTemplateSlug}`
                          : "Notification title")}
                  </p>
                  <p className="truncate text-[11px] text-grayScale-500">
                    {channel === "email" && !emailTemplateSlug && htmlBody.trim()
                      ? "HTML email body"
                      : message || "Message preview will appear here."}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-grayScale-400">
              Channel: {channel.toUpperCase().replace("_", "-")}
              {channel === "email" && emailTemplateSlug
                ? ` · Template: ${emailTemplateSlug}`
                : channel === "email" && htmlBody.trim()
                  ? " · Free-form HTML"
                  : ""}
              {isScheduling && scheduledAt
                ? ` · Scheduled ${formatScheduledAtLabel(scheduledAt)}`
                : ""}
            </p>
          </div>
        )}

        {/* Navigation bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-grayScale-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={goPrev} disabled={sending}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={resetForm} disabled={sending}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-grayScale-400">
              {isLastStep
                ? isScheduling
                  ? "Creates a scheduled job processed by the backend worker."
                  : "Delivers immediately with sent/failed counts returned."
                : "Step " + currentStep + " of 4"}
            </p>
            {isLastStep ? (
              <Button
                type="submit"
                size="sm"
                className="bg-brand-600 hover:bg-brand-500"
                disabled={sending || (channel === "email" ? !emailContentReady : !message.trim())}
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
            ) : (
              <Button type="submit" size="sm" className="bg-brand-600 hover:bg-brand-500">
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
