import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Clock3,
  Hash,
  Mail,
  Phone,
  Shield,
  User,
  UserCircle2,
} from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Separator } from "../../components/ui/separator"
import { cn } from "../../lib/utils"
import { getTeamMemberById } from "../../api/team.api"
import type { TeamMemberDetail } from "../../types/team.types"

function formatRoleLabel(role: string): string {
  const value = role.trim()
  if (!value) return "—"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function formatStatusLabel(status: string): string {
  const value = status.trim()
  if (!value) return "—"
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return "—"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return "—"
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

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
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

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-50">
        <Icon className="h-4 w-4 text-grayScale-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-grayScale-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-grayScale-800">{value}</p>
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-grayScale-100 bg-white px-4 py-3.5 shadow-soft">
      <div className="flex items-center gap-2 text-grayScale-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-grayScale-800">{value}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="h-5 w-32 animate-pulse rounded bg-grayScale-100" />
      <div className="h-8 w-56 animate-pulse rounded-lg bg-grayScale-100" />
      <div className="h-24 animate-pulse rounded-xl bg-grayScale-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl bg-grayScale-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-grayScale-100" />
    </div>
  )
}

export function TeamMemberDetailPage() {
  const { id } = useParams()
  const [member, setMember] = useState<TeamMemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) return <LoadingSkeleton />

  if (error || !member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-8 w-8 text-grayScale-300" />
            </div>
            <p className="text-lg font-semibold text-grayScale-600">
              {error || "Member not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${member.first_name} ${member.last_name}`.trim()
  const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase()
  const isActive = member.status.trim().toLowerCase() === "active"

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team
      </Link>

      <div>
        <p className="text-sm font-semibold text-grayScale-500">Team directory</p>
        <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">{fullName}</h1>
        <p className="mt-1 text-sm text-grayScale-500">
          Member #{member.id} · {displayValue(member.department)}
        </p>
      </div>

      <Card className="border-grayScale-100 shadow-soft">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-grayScale-100 text-base font-semibold text-grayScale-600">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-grayScale-800">{fullName}</p>
            <p className="text-sm text-grayScale-500">{displayValue(member.job_title)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                getRoleBadgeClasses(member.team_role),
              )}
            >
              <Shield className="mr-1 h-3 w-3" />
              {formatRoleLabel(member.team_role)}
            </span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {formatStatusLabel(member.status)}
            </Badge>
            <Badge variant={member.email_verified ? "default" : "outline"}>
              {member.email_verified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={CalendarDays} label="Joined" value={formatDate(member.created_at)} />
        <StatTile icon={Clock3} label="Last login" value={formatDateTime(member.last_login)} />
        <StatTile
          icon={BadgeCheck}
          label="Email status"
          value={member.email_verified ? "Verified" : "Not verified"}
        />
        <StatTile icon={Clock3} label="Last updated" value={formatDateTime(member.updated_at)} />
      </div>

      <Card className="border-grayScale-100 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Member record</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {member.bio ? (
            <div className="mb-4 rounded-lg border border-grayScale-100 bg-grayScale-50/60 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-grayScale-400">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-grayScale-700">{member.bio}</p>
            </div>
          ) : null}

          <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Contact
              </p>
              <DetailRow icon={Mail} label="Email" value={displayValue(member.email)} />
              <Separator />
              <DetailRow icon={Phone} label="Phone" value={displayValue(member.phone_number)} />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Role & organization
              </p>
              <DetailRow icon={Shield} label="Team role" value={formatRoleLabel(member.team_role)} />
              <Separator />
              <DetailRow icon={Building2} label="Department" value={displayValue(member.department)} />
              <Separator />
              <DetailRow icon={Briefcase} label="Job title" value={displayValue(member.job_title)} />
              <Separator />
              <DetailRow icon={Hash} label="Member ID" value={String(member.id)} />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-2 text-xs text-grayScale-400">
            <UserCircle2 className="h-3.5 w-3.5" />
            <span>Read-only team directory record</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
