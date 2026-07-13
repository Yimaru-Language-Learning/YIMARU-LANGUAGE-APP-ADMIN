import { useEffect, useState } from "react";
import { Pencil, User } from "lucide-react";
import { toast } from "sonner";
import { notifyApiError } from "../lib/apiErrors";
import { getTeamMe, updateTeamMe } from "../api/team.api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { SpinnerIcon } from "../components/ui/spinner-icon";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import type { TeamMeProfile } from "../types/team.types";
import { ProfileAvatarUpload } from "../components/profile/ProfileAvatarUpload";
import { PersonaProfilePictureUploadField } from "./personas/components/PersonaProfilePictureUploadField";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRoleLabel(role: string): string {
  const value = role.trim();
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function FieldGroup({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-grayScale-400">{label}</p>
      <p
        className={cn(
          "text-sm font-medium text-grayScale-900",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-grayScale-100 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold text-grayScale-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-grayScale-100" />
      <div className="h-28 animate-pulse rounded-xl bg-grayScale-100" />
      <div className="h-48 animate-pulse rounded-xl bg-grayScale-100" />
      <div className="h-48 animate-pulse rounded-xl bg-grayScale-100" />
    </div>
  );
}

type EditFormState = {
  first_name: string;
  last_name: string;
  phone_number: string;
  department: string;
  job_title: string;
  profile_picture_url: string;
  bio: string;
  work_phone: string;
};

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
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useState<TeamMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    first_name: "",
    last_name: "",
    phone_number: "",
    department: "",
    job_title: "",
    profile_picture_url: "",
    bio: "",
    work_phone: "",
  });

  const busy = saving || uploadingPicture;

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTeamMe();
      setProfile(res.data.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setProfile(null);
      setError("Failed to load profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const startEditing = () => {
    if (!profile) return;
    setEditForm(profileToEditForm(profile));
    setUploadingPicture(false);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    const firstName = editForm.first_name.trim();
    const lastName = editForm.last_name.trim();

    if (!firstName || !lastName) {
      toast.error("First name and last name are required");
      return;
    }

    setSaving(true);
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
      });
      setProfile(res.data.data);
      setEditing(false);
      toast.success(res.data.message || "Profile updated successfully");
    } catch (err) {
      console.error("Failed to update profile", err);
      notifyApiError(err, "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl py-16">
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-5 p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grayScale-50">
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
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  const handleProfileUpdate = (nextProfile: TeamMeProfile) => {
    setProfile(nextProfile);
    setEditForm((prev) => ({
      ...prev,
      profile_picture_url: nextProfile.profile_picture_url ?? "",
    }));
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-grayScale-900">
        My Profile
      </h1>

      {/* Hero */}
      <Card className="border border-grayScale-100 shadow-none">
        <CardContent className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-5">
            <ProfileAvatarUpload
              avatarUrl={profile.profile_picture_url}
              initials={initials}
              onProfileUpdate={handleProfileUpdate}
            />
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-grayScale-900">
                {fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-grayScale-200 px-3 py-0.5 text-[11px] font-medium text-grayScale-600"
                >
                  {formatRoleLabel(profile.team_role)}
                </Badge>
                {profile.job_title?.trim() && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-grayScale-200 px-3 py-0.5 text-[11px] font-medium text-grayScale-600"
                  >
                    {profile.job_title}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-3 py-0.5 text-[11px] font-medium",
                    profile.email_verified
                      ? "border-green-200 text-green-600"
                      : "border-grayScale-200 text-grayScale-500",
                  )}
                >
                  {profile.email_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs font-medium text-grayScale-500"
            onClick={startEditing}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <SectionCard title="Personal Information">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <FieldGroup label="First Name" value={profile.first_name} />
          <FieldGroup label="Last Name" value={profile.last_name} />
          <FieldGroup label="Email address" value={profile.email} />
          <FieldGroup label="Phone" value={profile.phone_number} />
          <div className="sm:col-span-2">
            <FieldGroup label="Bio" value={displayValue(profile.bio)} />
          </div>
        </div>
      </SectionCard>

      {/* Work Details */}
      <SectionCard title="Work Details">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <FieldGroup
            label="Department"
            value={displayValue(profile.department)}
          />
          <FieldGroup
            label="Job Title"
            value={displayValue(profile.job_title)}
          />
          <FieldGroup
            label="Work Phone"
            value={displayValue(profile.work_phone)}
          />
          <FieldGroup label="Member ID" value={String(profile.id)} mono />
        </div>
      </SectionCard>

      {/* Account Activity */}
      <SectionCard title="Account Activity">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <FieldGroup label="Joined" value={formatDate(profile.created_at)} />
          <FieldGroup
            label="Last Login"
            value={formatDateTime(profile.last_login)}
          />
          <FieldGroup
            label="Email Verified"
            value={profile.email_verified ? "Yes" : "No"}
          />
          <FieldGroup
            label="Last Updated"
            value={formatDate(profile.updated_at)}
          />
        </div>
      </SectionCard>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={(open) => !busy && setEditing(open)}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-grayScale-100 px-6 py-5 pr-14">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-brand-100/60">
              <User className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-grayScale-900">
                Edit profile
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-grayScale-500">
                Update your personal and work information.
              </DialogDescription>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-first-name"
                >
                  First name <span className="text-brand-500">*</span>
                </label>
                <Input
                  id="profile-first-name"
                  value={editForm.first_name}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-last-name"
                >
                  Last name <span className="text-brand-500">*</span>
                </label>
                <Input
                  id="profile-last-name"
                  value={editForm.last_name}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-phone"
                >
                  Phone number
                </label>
                <Input
                  id="profile-phone"
                  value={editForm.phone_number}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-work-phone"
                >
                  Work phone
                </label>
                <Input
                  id="profile-work-phone"
                  value={editForm.work_phone}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      work_phone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-department"
                >
                  Department
                </label>
                <Input
                  id="profile-department"
                  value={editForm.department}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium text-grayScale-600"
                  htmlFor="profile-job-title"
                >
                  Job title
                </label>
                <Input
                  id="profile-job-title"
                  value={editForm.job_title}
                  disabled={busy}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      job_title: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
                Email
              </label>
              <Input value={profile.email} disabled />
              <p className="mt-1 text-[11px] text-grayScale-400">
                Email is managed by your administrator.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-600">
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

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-grayScale-600"
                htmlFor="profile-bio"
              >
                Bio
              </label>
              <Textarea
                id="profile-bio"
                value={editForm.bio}
                disabled={busy}
                rows={4}
                placeholder="A short introduction about your role and background."
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-grayScale-100 px-6 pb-6 pt-4 pr-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 text-white hover:bg-brand-600"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <SpinnerIcon className="mr-2 h-4 w-4" /> : null}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
