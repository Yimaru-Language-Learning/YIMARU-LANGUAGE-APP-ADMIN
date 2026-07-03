import { useEffect, useState } from "react"
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../lib/apiErrors"
import { getTeamMe, updateTeamMe } from "../api/team.api"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { SpinnerIcon } from "../components/ui/spinner-icon"
import { Textarea } from "../components/ui/textarea"
import { cn } from "../lib/utils"
import type { TeamMeProfile } from "../types/team.types"
import { ProfileAvatarUpload } from "../components/profile/ProfileAvatarUpload"
import { PersonaProfilePictureUploadField } from "./personas/components/PersonaProfilePictureUploadField"

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
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

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-grayScale-500">{label}</p>
      <p className="text-sm font-medium text-grayScale-700">{value}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-grayScale-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-grayScale-100" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((item) => (
          <div key={item} className="h-56 animate-pulse rounded-2xl bg-grayScale-100" />
        ))}
      </div>
    </div>
  )
}

type EditFormState = {
  first_name: string
  last_name: string
  phone_number: string
  department: string
  job_title: string
  profile_picture_url: string
  bio: string
  work_phone: string
}

function profileToEditForm(profile: TeamMeProfile): EditFormState {
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone_number: profile.phone_number,
    department: profile.department ?? "",
    job_title: profile.job_title ?? "",
    profile_picture_url: profile.profile_picture_url ?? "",
    bio: profile.bio ?? "",
    work_phone: profile.work_phone ?? "",
  }
}

export function ProfilePage() {
  const [profile, setProfile] = useState<TeamMeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState>({
    first_name: "",
    last_name: "",
    phone_number: "",
    department: "",
    job_title: "",
    profile_picture_url: "",
    bio: "",
    work_phone: "",
  })

  const busy = saving || uploadingPicture

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTeamMe()
      setProfile(res.data.data)
    } catch (err) {
      console.error("Failed to fetch profile", err)
      setProfile(null)
      setError("Failed to load profile. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  const startEditing = () => {
    if (!profile) return
    setEditForm(profileToEditForm(profile))
    setUploadingPicture(false)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!profile) return

    const firstName = editForm.first_name.trim()
    const lastName = editForm.last_name.trim()

    if (!firstName || !lastName) {
      toast.error("First name and last name are required")
      return
    }

    setSaving(true)
    try {
      const res = await updateTeamMe({
        first_name: firstName,
        last_name: lastName,
        phone_number: editForm.phone_number.trim(),
        department: editForm.department.trim(),
        job_title: editForm.job_title.trim(),
        profile_picture_url: editForm.profile_picture_url.trim(),
        bio: editForm.bio.trim(),
        work_phone: editForm.work_phone.trim(),
      })
      setProfile(res.data.data)
      setEditing(false)
      toast.success(res.data.message || "Profile updated successfully")
    } catch (err) {
      console.error("Failed to update profile", err)
      notifyApiError(err, "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton />

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-5 p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-10 w-10 text-grayScale-300" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-grayScale-700">
                {error || "Profile not available"}
              </p>
              <p className="mt-1 text-sm text-grayScale-500">
                Please check your connection and try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadProfile()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim()
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
  const isActive = profile.status.toLowerCase() === "active"

  const handleProfileUpdate = (nextProfile: TeamMeProfile) => {
    setProfile(nextProfile)
    setEditForm((prev) => ({
      ...prev,
      profile_picture_url: nextProfile.profile_picture_url ?? "",
    }))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">My profile</h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Your team account details from the admin directory.
          </p>
        </div>
        <Button className="bg-brand-500 text-white hover:bg-brand-600" onClick={startEditing}>
          Edit profile
        </Button>
      </div>

      <Card className="overflow-hidden border-grayScale-100 shadow-soft">
        <div className="h-28 bg-gradient-to-r from-brand-500/20 via-brand-300/20 to-brand-100/40" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <ProfileAvatarUpload
                avatarUrl={profile.profile_picture_url}
                initials={initials}
                onProfileUpdate={handleProfileUpdate}
              />
              <div className="pb-1">
                <h2 className="text-2xl font-semibold text-grayScale-800">{fullName}</h2>
                <p className="text-sm text-grayScale-500">{displayValue(profile.job_title)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <Badge variant={isActive ? "default" : "secondary"}>
                {formatStatusLabel(profile.status)}
              </Badge>
              <Badge variant={profile.email_verified ? "default" : "outline"}>
                {profile.email_verified ? "Email verified" : "Email not verified"}
              </Badge>
            </div>
          </div>
          {profile.bio?.trim() ? (
            <p className="mt-4 text-sm leading-relaxed text-grayScale-600">{profile.bio.trim()}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Work details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Team role" value={formatRoleLabel(profile.team_role)} />
            <ReadOnlyField label="Department" value={displayValue(profile.department)} />
            <ReadOnlyField label="Job title" value={displayValue(profile.job_title)} />
            <ReadOnlyField label="Member ID" value={String(profile.id)} />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-grayScale-700">
              <Mail className="h-4 w-4 text-brand-600" />
              <span>{displayValue(profile.email)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-grayScale-700">
              <Phone className="h-4 w-4 text-brand-600" />
              <span>{displayValue(profile.phone_number)}</span>
            </div>
            {profile.work_phone?.trim() ? (
              <div className="flex items-center gap-3 text-sm text-grayScale-700">
                <Phone className="h-4 w-4 text-brand-600" />
                <span>
                  <span className="text-grayScale-500">Work: </span>
                  {profile.work_phone.trim()}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-brand-600" />
              <ReadOnlyField label="Joined" value={formatDate(profile.created_at)} />
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-brand-600" />
              <ReadOnlyField label="Last login" value={formatDateTime(profile.last_login)} />
            </div>
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-brand-600" />
              <ReadOnlyField
                label="Email verification"
                value={profile.email_verified ? "Verified" : "Not verified"}
              />
            </div>
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-brand-600" />
              <ReadOnlyField label="Last updated" value={formatDate(profile.updated_at)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={(open) => !busy && setEditing(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-first-name">
                First name
              </label>
              <Input
                id="profile-first-name"
                value={editForm.first_name}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-last-name">
                Last name
              </label>
              <Input
                id="profile-last-name"
                value={editForm.last_name}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-phone">
                Phone number
              </label>
              <Input
                id="profile-phone"
                value={editForm.phone_number}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone_number: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-work-phone">
                Work phone
              </label>
              <Input
                id="profile-work-phone"
                value={editForm.work_phone}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, work_phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-department">
                Department
              </label>
              <Input
                id="profile-department"
                value={editForm.department}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, department: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-job-title">
                Job title
              </label>
              <Input
                id="profile-job-title"
                value={editForm.job_title}
                disabled={busy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, job_title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-grayScale-700">Email</label>
              <Input value={profile.email} disabled />
              <p className="text-xs text-grayScale-500">Email is managed by your administrator.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-picture">
                Profile picture
              </label>
              <PersonaProfilePictureUploadField
                value={editForm.profile_picture_url}
                disabled={busy}
                onUploadBusyChange={setUploadingPicture}
                onChange={(profile_picture_url) =>
                  setEditForm((prev) => ({ ...prev, profile_picture_url }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-grayScale-700" htmlFor="profile-bio">
                Bio
              </label>
              <Textarea
                id="profile-bio"
                value={editForm.bio}
                disabled={busy}
                rows={4}
                placeholder="A short introduction about your role and background."
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              className={cn("bg-brand-500 text-white hover:bg-brand-600")}
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <SpinnerIcon className="mr-2 h-4 w-4" /> : null}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
