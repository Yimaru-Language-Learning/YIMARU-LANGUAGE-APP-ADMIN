import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Mail, MailOpen, Megaphone } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { FileUpload } from "../../components/ui/file-upload"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import { getTeamMembers } from "../../api/team.api"
import type { TeamMember } from "../../types/team.types"

export function CreateNotificationPage() {
  const navigate = useNavigate()

  const [composeChannels, setComposeChannels] = useState<Array<"push" | "sms">>(["push"])
  const [composeAudience, setComposeAudience] = useState<"all" | "selected">("all")
  const [teamRecipients, setTeamRecipients] = useState<TeamMember[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([])
  const [composeTitle, setComposeTitle] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [, setComposeImage] = useState<File | null>(null)

  useEffect(() => {
    setRecipientsLoading(true)
    getTeamMembers(1, 50)
      .then((res) => {
        setTeamRecipients(res.data.data ?? [])
      })
      .catch(() => {
        setTeamRecipients([])
      })
      .finally(() => {
        setRecipientsLoading(false)
      })
  }, [])

  const selectedRecipients = useMemo(
    () => teamRecipients.filter((m) => selectedRecipientIds.includes(m.id)),
    [teamRecipients, selectedRecipientIds],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeTitle.trim() || !composeMessage.trim()) return
    if (composeChannels.length === 0) return
    setSending(true)
    try {
      // Hook up to backend send API here when available.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setComposeTitle("")
      setComposeMessage("")
      setComposeAudience("all")
      setComposeChannels(["push"])
      setSelectedRecipientIds([])
      setComposeImage(null)
      navigate("/notifications")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Breadcrumb + Header */}
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
          <span className="text-grayScale-500">Create</span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-grayScale-400">
              Notifications
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-grayScale-700">
              Create notification
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-500/90 px-2 text-[11px] font-medium text-white">
                <Megaphone className="h-3.5 w-3.5" />
                Composer
              </span>
            </h1>
            <p className="mt-1 text-xs text-grayScale-400">
              Send a one-off push or SMS notification to your users.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => navigate("/notifications")}
          >
            Back to notifications
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]"
      >
        {/* Left: message setup */}
        <div className="space-y-4">
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="space-y-4 p-4">
              {/* Channel & audience */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                    Channel
                  </p>
                  <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() =>
                        setComposeChannels((prev) =>
                          prev.includes("push")
                            ? prev.filter((c) => c !== "push")
                            : [...prev, "push"],
                        )
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        composeChannels.includes("push")
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Push
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setComposeChannels((prev) =>
                          prev.includes("sms")
                            ? prev.filter((c) => c !== "sms")
                            : [...prev, "sms"],
                        )
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        composeChannels.includes("sms")
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      SMS
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                    Audience
                  </p>
                  <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setComposeAudience("all")}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        composeAudience === "all"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      All users
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeAudience("selected")}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                        composeAudience === "selected"
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-grayScale-500 hover:text-grayScale-700",
                      )}
                    >
                      Selected users
                    </button>
                  </div>
                </div>
              </div>

              {/* Title & message */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Title
                  </label>
                  <Input
                    placeholder="Short headline for this notification"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-500">
                    Message
                  </label>
                  <Textarea
                    rows={4}
                    placeholder={
                      composeChannels.includes("sms") && !composeChannels.includes("push")
                        ? "Concise SMS body. Keep it clear and under 160 characters where possible."
                        : "Notification body shown inside the app."
                    }
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image upload */}
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="space-y-2 p-4">
              <p className="mb-1 block text-xs font-medium text-grayScale-500">
                Image (push only)
              </p>
              <FileUpload
                accept="image/*"
                onFileSelect={setComposeImage}
                label="Upload notification image"
                description="Shown with push notification where supported"
                className="min-h-[110px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
              />
              <p className="text-[10px] text-grayScale-400">
                Image will be ignored for SMS-only sends. Connect your push provider to attach it to
                real notifications.
              </p>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-grayScale-400">
              This is a UI-only preview. Hook into your notification API to deliver messages.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setComposeTitle("")
                  setComposeMessage("")
                  setComposeAudience("all")
                  setComposeChannels(["push"])
                  setSelectedRecipientIds([])
                  setComposeImage(null)
                }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending || !composeTitle.trim() || !composeMessage.trim()}
              >
                {sending ? (
                  <>
                    <SpinnerIcon className="mr-2 h-3.5 w-3.5" alt="" />
                    Sending…
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-3.5 w-3.5" />
                    Send notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: audience & preview */}
        <div className="space-y-4">
          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-grayScale-600">Audience & channels</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-grayScale-100 px-2 py-0.5 text-[10px] font-medium text-grayScale-500">
                  {composeChannels.join(" + ").toUpperCase() || "—"}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-grayScale-500">
                <p>
                  <span className="font-semibold text-grayScale-600">Audience:</span>{" "}
                  {composeAudience === "all"
                    ? "All users"
                    : selectedRecipients.length === 0
                      ? "No users selected yet"
                      : `${selectedRecipients.length} selected user${
                          selectedRecipients.length === 1 ? "" : "s"
                        }`}
                </p>
                <p>
                  <span className="font-semibold text-grayScale-600">Channels:</span>{" "}
                  {composeChannels.length === 0
                    ? "None selected"
                    : composeChannels.map((c) => c.toUpperCase()).join(" + ")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border border-grayScale-100">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-grayScale-600">Selected users</p>
                {composeAudience === "selected" && (
                  <span className="text-[10px] text-grayScale-400">
                    {selectedRecipients.length} selected
                  </span>
                )}
              </div>
              {composeAudience === "all" ? (
                <p className="text-[11px] text-grayScale-400">
                  All eligible users will receive this notification. Switch to{" "}
                  <span className="font-semibold text-grayScale-600">Selected users</span> to target
                  specific people.
                </p>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-grayScale-100 bg-grayScale-50/60 p-2">
                  {recipientsLoading && (
                    <div className="flex items-center justify-center py-6 text-xs text-grayScale-400">
                      <SpinnerIcon className="mr-2 h-4 w-4" alt="" />
                      Loading users…
                    </div>
                  )}
                  {!recipientsLoading && teamRecipients.length === 0 && (
                    <div className="py-4 text-center text-xs text-grayScale-400">
                      No users available to select.
                    </div>
                  )}
                  {!recipientsLoading &&
                    teamRecipients.map((member) => {
                      const checked = selectedRecipientIds.includes(member.id)
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
                              setSelectedRecipientIds((prev) =>
                                e.target.checked
                                  ? [...prev, member.id]
                                  : prev.filter((id) => id !== member.id),
                              )
                            }}
                          />
                          <span className="truncate">
                            {member.first_name} {member.last_name}
                            <span className="ml-1 text-[10px] text-grayScale-400">
                              · {member.email}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile preview card */}
          <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/40">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold text-grayScale-600">Preview</p>
              <div className="space-y-1 rounded-xl border border-grayScale-200 bg-white p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/90 text-white">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-grayScale-800">
                      {composeTitle || "Notification title"}
                    </p>
                    <p className="truncate text-[11px] text-grayScale-500">
                      {composeMessage || "Message preview will appear here."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

