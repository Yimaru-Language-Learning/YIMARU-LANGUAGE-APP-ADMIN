import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Clock3,
  ClipboardList,
  Mail,
  Phone,
  Shield,
  User,
  UsersRound,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Separator } from "../../components/ui/separator"
import { cn } from "../../lib/utils"
import { notifyApiError } from "../../lib/apiErrors"
import { formatTeamRoleLabel } from "../../lib/teamRoles"
import { DisplayValue, NOT_ASSIGNED_LABEL, UnassignedLabel, displayValue, isUnassignedLabel } from "../../lib/displayValue"
import { getTeamMemberById, updateTeamMemberStatus } from "../../api/team.api"
import type { TeamMemberDetail } from "../../types/team.types"
import { ActivityLogListPanel } from "../user-log/components/ActivityLogListPanel"

function formatStatusLabel(status: string): string {
  const value = status.trim()
  if (!value) return NOT_ASSIGNED_LABEL
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return NOT_ASSIGNED_LABEL
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(
  dateStr: string | null | undefined,
  emptyLabel: string = NOT_ASSIGNED_LABEL,
): string {
  if (!dateStr?.trim()) return emptyLabel
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return "Never"
  const now = new Date()
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return NOT_ASSIGNED_LABEL
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

function getStatusClasses(status: string): string {
  const normalized = status.trim().toLowerCase()
  if (normalized === "active") {
    return "bg-mint-500/15 text-mint-500 border border-mint-500/25"
  }
  if (normalized === "invited" || normalized === "pending") {
    return "bg-gold-100 text-gold-600 border border-gold-300/40"
  }
  return "bg-destructive/15 text-destructive border border-destructive/25"
}

function getRoleBadgeClasses(role: string): string {
  const normalized = role.trim().toLowerCase()
  switch (normalized) {
    case "super_admin":
      return "bg-brand-500/15 text-brand-600 border border-brand-500/25"
    case "admin":
      return "bg-brand-100 text-brand-600 border border-brand-200"
    case "content_manager":
      return "bg-mint-100 text-mint-500 border border-mint-300/40"
    case "instructor":
      return "bg-gold-100 text-gold-600 border border-gold-300/40"
    case "support_agent":
      return "bg-orange-100 text-orange-600 border border-orange-200"
    case "finance":
      return "bg-sky-100 text-sky-600 border border-sky-200"
    case "hr":
      return "bg-pink-100 text-pink-600 border border-pink-200"
    case "analyst":
      return "bg-violet-100 text-violet-600 border border-violet-200"
    default:
      return "bg-grayScale-100 text-grayScale-600 border border-grayScale-200"
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-grayScale-100" />
      <div className="h-8 w-56 animate-pulse rounded-lg bg-grayScale-100" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-2xl bg-grayScale-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-grayScale-100" />
        </div>
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl bg-grayScale-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-grayScale-100" />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
        {label}
      </p>
      <p className="text-sm text-grayScale-700">
        {typeof value === "string" && isUnassignedLabel(value) ? <UnassignedLabel /> : value}
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-grayScale-500">{label}</span>
      <span className="text-right text-sm font-medium text-grayScale-700">
        {typeof value === "string" && isUnassignedLabel(value) ? <UnassignedLabel /> : value}
      </span>
    </div>
  )
}

function ContactField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100">
        <Icon className="h-4 w-4 text-grayScale-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
          {label}
        </p>
        <p className="truncate text-sm text-grayScale-700">
          {typeof value === "string" && isUnassignedLabel(value) ? <UnassignedLabel /> : value}
        </p>
      </div>
    </div>
  )
}

export function TeamMemberDetailPage() {
  const { id } = useParams()
  const [member, setMember] = useState<TeamMemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ newStatus: string } | null>(null)

  useEffect(() => {
    const memberId = Number(id)
    if (!Number.isFinite(memberId) || memberId <= 0) {
      setError("Invalid team member ID.")
      setLoading(false)
      return
    }

    const fetchMember = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getTeamMemberById(memberId)
        setMember(res.data.data)
      } catch (err) {
        console.error("Failed to fetch team member", err)
        setMember(null)
        setError("Team member not found.")
      } finally {
        setLoading(false)
      }
    }

    void fetchMember()
  }, [id])

  const handleStatusToggleClick = () => {
    if (!member || updatingStatus) return
    const isCurrentlyActive = member.status.trim().toLowerCase() === "active"
    setConfirmDialog({ newStatus: isCurrentlyActive ? "inactive" : "active" })
  }

  const handleConfirmStatusUpdate = async () => {
    if (!member || !confirmDialog) return
    const { newStatus } = confirmDialog
    const previousStatus = member.status

    setUpdatingStatus(true)
    setMember((prev) => (prev ? { ...prev, status: newStatus } : prev))
    try {
      await updateTeamMemberStatus(member.id, newStatus)
      toast.success(
        `Team member ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      )
    } catch (err: unknown) {
      setMember((prev) => (prev ? { ...prev, status: previousStatus } : prev))
      notifyApiError(err, "Failed to update team member status")
    } finally {
      setUpdatingStatus(false)
      setConfirmDialog(null)
    }
  }

  if (loading) return <LoadingSkeleton />

  if (error || !member) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 py-12">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-8 w-8 text-grayScale-300" />
            </div>
            <p className="text-lg font-semibold text-grayScale-600">
              {error || "Member not found"}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/team">Back to Team</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${member.first_name} ${member.last_name}`.trim()
  const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase()
  const roleLabel = formatTeamRoleLabel(member.team_role)
  const isActive = member.status.trim().toLowerCase() === "active"

  return (
    <div className="space-y-6">
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Team members</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">{fullName}</h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Member #{member.id}
            {member.department?.trim() ? ` · ${member.department.trim()}` : ""}
          </p>
        </div>
        <Button
          variant={isActive ? "destructive" : "outline"}
          onClick={handleStatusToggleClick}
          disabled={updatingStatus}
        >
          {updatingStatus ? "Updating..." : isActive ? "Block Member" : "Unblock Member"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-soft">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback className="bg-brand-100 text-lg font-semibold text-brand-600">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-grayScale-800">{fullName}</h2>
                  <p className="truncate text-sm text-grayScale-500">
                    <DisplayValue value={member.job_title} />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        getRoleBadgeClasses(member.team_role),
                      )}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {roleLabel}
                    </span>
                    <Badge className={cn(getStatusClasses(member.status))}>
                      {formatStatusLabel(member.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <ContactField icon={Mail} label="Email" value={<DisplayValue value={member.email} />} />
                <ContactField icon={Phone} label="Phone" value={<DisplayValue value={member.phone_number} />} />
              </div>

              <Separator />

              <div className="grid gap-3 text-sm">
                <InfoRow label="Email verified" value={member.email_verified ? "Yes" : "No"} />
                <InfoRow label="Joined" value={formatDate(member.created_at)} />
                <InfoRow label="Last login" value={formatDateTime(member.last_login, "Never")} />
                <InfoRow label="Last updated" value={formatDateTime(member.updated_at)} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
                  <Clock3 className="h-4 w-4 text-brand-600" />
                </div>
                <CardTitle className="text-base">Activity summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Member ID" value={`#${member.id}`} />
              <InfoRow label="Last seen" value={getRelativeTime(member.last_login)} />
              <InfoRow
                label="Verification"
                value={member.email_verified ? "Verified" : "Pending verification"}
              />
              <InfoRow label="Account status" value={formatStatusLabel(member.status)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100/60">
                  <UsersRound className="h-4 w-4 text-mint-600" />
                </div>
                <CardTitle className="text-base">Role & organization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Team role" value={roleLabel} />
                <InfoItem label="Department" value={<DisplayValue value={member.department} />} />
                <InfoItem label="Job title" value={<DisplayValue value={member.job_title} />} />
                <InfoItem label="Member ID" value={String(member.id)} />
                <InfoItem label="Joined" value={formatDate(member.created_at)} />
                <InfoItem
                  label="Email status"
                  value={member.email_verified ? "Verified" : "Not verified"}
                />
              </div>

              {member.bio?.trim() ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                      Bio
                    </p>
                    <div className="rounded-xl bg-grayScale-100 p-4 text-sm leading-relaxed text-grayScale-700">
                      {member.bio.trim()}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80">
                  <ClipboardList className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Account activity</CardTitle>
                  <p className="mt-0.5 text-xs text-grayScale-500">
                    Platform audit trail for actions performed by this team member.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityLogListPanel fixedActorId={member.id} compact showStats={false} />
            </CardContent>
          </Card>
        </div>
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Confirm Status Change</h2>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold">{fullName || "this team member"}</span> to{" "}
                <span className="font-semibold capitalize">{confirmDialog.newStatus}</span>?
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmDialog(null)} disabled={updatingStatus}>
                Cancel
              </Button>
              <Button
                className="bg-brand-600 text-white hover:bg-brand-500"
                onClick={() => void handleConfirmStatusUpdate()}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
