import { useEffect, useState, type ChangeEvent } from "react";
import { BadgeCheck, Briefcase, CalendarDays, Mail, Phone, Shield, User } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { FileUpload } from "../components/ui/file-upload";
import { getMyProfile } from "../api/users.api";
import { updateTeamMember } from "../api/team.api";
import { uploadImageFile } from "../api/files.api";
import { SpinnerIcon } from "../components/ui/spinner-icon";
import type { UpdateTeamMemberRequest } from "../types/team.types";
import { toast } from "sonner";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface TeamMeProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  employment_type: string
  hire_date: string
  bio: string
  status: string
  email_verified: boolean
  permissions: string[]
  last_login: string | null
  created_at: string
  emergency_contact?: string
  work_phone?: string
  profile_picture_url?: string
}

function LoadingSkeleton() {
  return (
    <div className="w-full space-y-8 py-10">
      <div className="animate-pulse space-y-8">
        <div className="overflow-hidden rounded-2xl border border-grayScale-100">
          <div className="h-40 bg-gradient-to-r from-grayScale-100 via-grayScale-200/60 to-grayScale-100" />
          <div className="flex flex-col items-center px-8 pb-8">
            <div className="-mt-14 h-28 w-28 rounded-full bg-grayScale-100 ring-4 ring-white" />
            <div className="mt-4 h-6 w-48 rounded-lg bg-grayScale-100" />
            <div className="mt-3 h-5 w-24 rounded-full bg-grayScale-100" />
            <div className="mt-5 flex gap-3">
              <div className="h-7 w-20 rounded-full bg-grayScale-100" />
              <div className="h-7 w-28 rounded-full bg-grayScale-100" />
              <div className="h-7 w-28 rounded-full bg-grayScale-100" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-grayScale-100 p-6">
              <div className="mb-5 h-5 w-40 rounded bg-grayScale-100" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-4 w-20 rounded bg-grayScale-100" />
                    <div className="h-4 w-28 rounded bg-grayScale-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [profile, setProfile] = useState<TeamMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState<UpdateTeamMemberRequest>({
    first_name: "",
    last_name: "",
    phone_number: "",
    profile_picture_url: "",
    bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setProfile((res.data?.data ?? null) as unknown as TeamMeProfile | null);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const startEditing = () => {
    if (!profile) return;
    const nextForm: UpdateTeamMemberRequest = {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone_number: profile.phone_number ?? "",
      profile_picture_url: profile.profile_picture_url ?? "",
      bio: profile.bio ?? "",
    };
    setEditForm(nextForm);
    setProfilePictureFile(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setProfilePictureFile(null);
    setEditing(false);
  };

  const updateField = (field: keyof UpdateTeamMemberRequest, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;

    let nextProfilePictureUrl = editForm.profile_picture_url ?? "";
    if (profilePictureFile) {
      try {
        const uploadRes = await uploadImageFile(profilePictureFile);
        const uploadedUrl = uploadRes.data?.data?.url?.trim();
        if (!uploadedUrl) throw new Error("Missing uploaded image url");
        nextProfilePictureUrl = uploadedUrl;
      } catch (err) {
        console.error("Failed to upload profile picture:", err);
        toast.error("Failed to upload profile picture");
        return;
      }
    }

    const payload: UpdateTeamMemberRequest = {
      bio: editForm.bio ?? "",
      first_name: editForm.first_name ?? "",
      last_name: editForm.last_name ?? "",
      phone_number: editForm.phone_number ?? "",
      profile_picture_url: nextProfilePictureUrl,
    };

    setSaving(true);
    try {
      await updateTeamMember(profile.id, payload);
      const refreshed = await getMyProfile();
      setProfile((refreshed.data?.data ?? null) as unknown as TeamMeProfile | null);
      setEditing(false);
      setProfilePictureFile(null);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Failed to update team member profile", err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !profile) {
    return (
      <div className="w-full py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-5 p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-10 w-10 text-grayScale-300" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight text-grayScale-600">
                {error || "Profile not available"}
              </p>
              <p className="mt-1 text-sm text-grayScale-400">
                Please check your connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto w-full max-w-7xl rounded-2xl bg-[#f7f1f8] p-4 pb-8 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-[#d9bddb] bg-white">
        <div className="h-40 w-full bg-gradient-to-r from-[#d6aed6] via-[#e4cce4] to-[#cba0cd]" />

        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-[#eadbea] bg-white px-5 pb-6">
            <div className="-mt-16">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#d6aed6] text-2xl font-bold text-[#6f2aa8]">
                {initials}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-grayScale-700">{fullName}</h2>
              <p className="text-sm text-grayScale-400">{profile.job_title || "Team Member"}</p>
            </div>

            <div className="mt-4">
              <div className="flex w-full items-center justify-between rounded-lg border border-[#d9bddb] bg-[#f4e8f4] px-3 py-2">
                <span className="text-sm font-medium text-[#6f2aa8]">Account Status</span>
                <span className="text-sm font-semibold uppercase text-[#5e2390]">{profile.status}</span>
              </div>
            </div>

            <div className="mt-5 space-y-5 text-sm">
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-400">About</p>
                <div className="space-y-2 text-grayScale-600">
                  <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#6f2aa8]" />{profile.job_title || "Job title not set"}</div>
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#6f2aa8]" />{profile.team_role || "Role not set"}</div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#6f2aa8]" />Hire date: {formatDate(profile.hire_date)}</div>
                  <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#6f2aa8]" />{profile.department || "Department not set"}</div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-400">Contact</p>
                <div className="space-y-2 text-grayScale-600">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#6f2aa8]" />{profile.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#6f2aa8]" />{profile.phone_number || "—"}</div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-400">Access</p>
                <p className="text-xs text-grayScale-500">Permissions from `/team/me`</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(profile.permissions ?? []).length === 0 ? (
                    <Badge className="bg-[#ecd9ec] text-[#6f2aa8]">No permissions listed</Badge>
                  ) : (
                    profile.permissions.map((permission) => (
                      <Badge key={permission} className="bg-[#ecd9ec] text-[#6f2aa8]">
                        {permission}
                      </Badge>
                    ))
                  )}
                </div>
              </section>
            </div>
          </aside>

          <main className="bg-[#fdf8fd] px-5 py-6 sm:px-7">
            <div className="space-y-5">
              <Card className="border-[#d9bddb] bg-white shadow-none">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-grayScale-700">Summary</h3>
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex items-center rounded-md border border-[#d9bddb] bg-[#f4e8f4] px-3 py-1.5 text-sm font-medium text-[#6f2aa8] transition-colors hover:bg-[#ecd9ec] hover:text-[#5e2390] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c39bd4]"
                    >
                      Edit profile
                    </button>
                  </div>
                  <div className="space-y-2 text-sm text-grayScale-600">
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#6f2aa8]" />{profile.job_title || "Role-focused work item"}</div>
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#6f2aa8]" />{profile.team_role || "Team responsibility"}</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#6f2aa8]" />{profile.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#6f2aa8]" />{profile.phone_number || "No phone number"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#d9bddb] bg-white shadow-none">
                <CardContent className="p-5">
                  <h3 className="mb-3 text-base font-semibold text-grayScale-700">Employment</h3>
                  <div className="rounded-lg border border-[#dcc3df] bg-[#f4e8f4] p-3">
                    <p className="text-sm font-medium text-grayScale-700">{profile.department || "Department not set"}</p>
                    <p className="text-xs text-grayScale-500">Employment type: {profile.employment_type || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#d9bddb] bg-white shadow-none">
                <CardContent className="p-5">
                  <h3 className="mb-3 text-base font-semibold text-grayScale-700">More about me</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#ecd9ec] text-[#6f2aa8]">Status {profile.status}</Badge>
                    <Badge className="bg-[#ecd9ec] text-[#6f2aa8]">Email {profile.email_verified ? "verified" : "not verified"}</Badge>
                    <Badge className="bg-[#ecd9ec] text-[#6f2aa8]">Joined {formatDate(profile.created_at)}</Badge>
                    <Badge className="bg-[#ecd9ec] text-[#6f2aa8]">Last login {formatDateTime(profile.last_login)}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#d9bddb] bg-white shadow-none">
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">First Name</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.first_name}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Last Name</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.last_name}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Department</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.department || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Team Role</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.team_role || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Job Title</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.job_title || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Hire Date</p>
                    <p className="text-sm font-medium text-grayScale-700">{formatDate(profile.hire_date) || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-grayScale-500">Phone Number</p>
                    <p className="text-sm font-medium text-grayScale-700">{profile.phone_number || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <Dialog open={editing} onOpenChange={(open) => !saving && setEditing(open)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-[#d9bddb] bg-[#fdf8fd] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6f2aa8]">Edit profile</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-grayScale-500">First Name</p>
              <Input value={editForm.first_name ?? ""} onChange={(e) => updateField("first_name", e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-grayScale-500">Last Name</p>
              <Input value={editForm.last_name ?? ""} onChange={(e) => updateField("last_name", e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-grayScale-500">Phone Number</p>
              <Input value={editForm.phone_number ?? ""} onChange={(e) => updateField("phone_number", e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-grayScale-500">Profile Picture</p>
              <div className="space-y-2">
                <FileUpload
                  accept="image/*"
                  onFileSelect={setProfilePictureFile}
                  label="Upload profile picture"
                  description="JPEG, PNG, WEBP"
                  className="min-h-[90px] rounded-lg border-2 border-dashed border-grayScale-200 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
                <Input
                  value={editForm.profile_picture_url ?? ""}
                  onChange={(e) => updateField("profile_picture_url", e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-medium text-grayScale-500">Bio</p>
              <Textarea
                value={editForm.bio ?? ""}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField("bio", e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#d9bddb] text-[#6f2aa8]"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#6f2aa8] text-white hover:bg-[#5e2390]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <SpinnerIcon className="mr-1 h-4 w-4" /> : null}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
