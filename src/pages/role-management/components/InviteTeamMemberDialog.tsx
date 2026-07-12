import { useEffect, useMemo, useState } from "react"
import { Mail, Shield } from "lucide-react"
import { toast } from "sonner"
import { fetchAllRoles } from "../../../api/rbac.api"
import { inviteTeamMember } from "../../../api/team.api"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Select } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { getApiErrorMessage } from "../../../lib/apiErrors"
import { cn } from "../../../lib/utils"
import {
  isValidInviteEmail,
  parseInviteEmails,
  type InviteEmailSendResult,
} from "../../../lib/parseInviteEmails"
import {
  formatTeamRoleLabel,
  rbacRolesToTeamRoleOptions,
  teamRoleNameForInvite,
  TEAM_ROLE_OPTIONS,
  type TeamRoleOption,
} from "../../../lib/teamRoles"

type InviteTeamMemberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetTeamRole?: string
  presetRoleLabel?: string
  roleOptions?: TeamRoleOption[]
  onInvited?: () => void
}

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  presetTeamRole,
  presetRoleLabel,
  roleOptions,
  onInvited,
}: InviteTeamMemberDialogProps) {
  const roleLocked = Boolean(presetTeamRole?.trim())
  const lockedRole = presetTeamRole?.trim() ?? ""

  const [emailsText, setEmailsText] = useState("")
  const [teamRole, setTeamRole] = useState(lockedRole)
  const [loadedRoleOptions, setLoadedRoleOptions] = useState<TeamRoleOption[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  )
  const [results, setResults] = useState<InviteEmailSendResult[] | null>(null)

  const parsedEmails = useMemo(() => parseInviteEmails(emailsText), [emailsText])
  const invalidEmails = useMemo(
    () => parsedEmails.filter((e) => !isValidInviteEmail(e)),
    [parsedEmails],
  )

  const fallbackRoleOptions = useMemo<TeamRoleOption[]>(
    () => TEAM_ROLE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    [],
  )

  const selectableRoleOptions = roleOptions?.length
    ? roleOptions
    : loadedRoleOptions.length
      ? loadedRoleOptions
      : fallbackRoleOptions

  useEffect(() => {
    if (!open || roleLocked || roleOptions?.length) return

    let cancelled = false
    setRolesLoading(true)
    void fetchAllRoles()
      .then((roles) => {
        if (cancelled) return
        setLoadedRoleOptions(rbacRolesToTeamRoleOptions(roles))
      })
      .catch(() => {
        if (!cancelled) setLoadedRoleOptions([])
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, roleLocked, roleOptions])

  useEffect(() => {
    if (!open) return
    setEmailsText("")
    setTeamRole(lockedRole)
    setResults(null)
    setProgress(null)
  }, [open, lockedRole])

  useEffect(() => {
    if (!open || roleLocked || lockedRole) return
    setTeamRole((current) => current || selectableRoleOptions[0]?.value || "")
  }, [open, roleLocked, lockedRole, selectableRoleOptions])

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) onOpenChange(false)
  }

  const sendInvitations = async (emails: string[], roleName: string) => {
    const outcome: InviteEmailSendResult[] = []

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      setProgress({ current: i + 1, total: emails.length })

      try {
        const res = await inviteTeamMember({ email, team_role: roleName })
        outcome.push({
          email,
          success: true,
          message: res.data?.message ?? "Invitation sent",
          invitationId: res.data?.data?.invitation_id,
        })
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err, "Failed to send invitation")
        outcome.push({ email, success: false, message: msg })
      }
    }

    return outcome
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const role = roleLocked ? lockedRole : teamRole
    const roleName = teamRoleNameForInvite(role, presetRoleLabel)

    if (parsedEmails.length === 0) {
      toast.error("Enter at least one email address")
      return
    }
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email: ${invalidEmails.join(", ")}`)
      return
    }
    if (!role) {
      toast.error("Team role is required")
      return
    }

    setSubmitting(true)
    setResults(null)
    try {
      const outcome = await sendInvitations(parsedEmails, roleName)
      setResults(outcome)

      const succeeded = outcome.filter((r) => r.success)
      const failed = outcome.filter((r) => !r.success)

      if (failed.length === 0) {
        toast.success(
          outcome.length === 1
            ? "Team invitation sent successfully"
            : `${succeeded.length} invitations sent successfully`,
        )
        onOpenChange(false)
        onInvited?.()
        return
      }

      if (succeeded.length === 0) {
        const firstFailed = failed[0]
        toast.error(firstFailed?.message ?? getApiErrorMessage(null, "No invitations were sent"))
      } else {
        toast.warning(
          `${succeeded.length} sent, ${failed.length} failed. Review details below.`,
        )
        onInvited?.()
      }
    } finally {
      setSubmitting(false)
      setProgress(null)
    }
  }

  const roleDisplay = presetRoleLabel?.trim() || formatTeamRoleLabel(teamRole)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-grayScale-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-grayScale-900">
            Invite team members
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            Send one invitation per email address. Invitees complete account setup using the link in
            their email
            {roleLocked ? (
              <>
                {" "}
                with role{" "}
                <span className="font-semibold text-grayScale-800">{roleDisplay}</span>.
              </>
            ) : (
              "."
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="invite-emails"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
            >
              <Mail className="h-3.5 w-3.5" />
              Email addresses
            </label>
            <Textarea
              id="invite-emails"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder={
                "one@example.com\nother@example.com\n\nOr comma-separated"
              }
              rows={5}
              className="min-h-[120px] resize-y font-mono text-sm"
              disabled={submitting}
            />
            <p className="mt-1.5 text-xs text-grayScale-500">
              {parsedEmails.length === 0
                ? "One email per line, or separated by commas"
                : `${parsedEmails.length} email${parsedEmails.length === 1 ? "" : "s"} ready to invite`}
              {invalidEmails.length > 0 ? (
                <span className="text-destructive">
                  {" "}
                  · {invalidEmails.length} invalid
                </span>
              ) : null}
            </p>
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
            >
              <Shield className="h-3.5 w-3.5" />
              Team role
            </label>
            {roleLocked ? (
              <Input
                id="invite-role"
                readOnly
                value={roleDisplay}
                className="cursor-not-allowed bg-grayScale-50 text-grayScale-700"
              />
            ) : (
              <Select
                id="invite-role"
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
                disabled={submitting || rolesLoading || selectableRoleOptions.length === 0}
              >
                {rolesLoading ? (
                  <option value="">Loading roles…</option>
                ) : selectableRoleOptions.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  selectableRoleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                )}
              </Select>
            )}
          </div>

          {progress ? (
            <p className="text-center text-xs font-medium text-brand-600">
              Sending invitation {progress.current} of {progress.total}…
            </p>
          ) : null}

          {results && results.length > 0 ? (
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-grayScale-200 bg-grayScale-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">
                Results
              </p>
              {results.map((r) => (
                <div
                  key={r.email}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs",
                    r.success
                      ? "bg-mint-500/10 text-grayScale-700"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  <span className="font-medium">{r.email}</span>
                  <span className="text-grayScale-500"> — {r.message}</span>
                </div>
              ))}
            </div>
          ) : null}

          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {results ? "Close" : "Cancel"}
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={submitting || parsedEmails.length === 0}
            >
              {submitting
                ? progress
                  ? `Sending ${progress.current}/${progress.total}…`
                  : "Sending…"
                : parsedEmails.length <= 1
                  ? "Send invitation"
                  : `Send ${parsedEmails.length} invitations`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
