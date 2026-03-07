import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Shield,
  User,
  X,
  XCircle,
  Briefcase,
  BookOpen,
  Target,
  Languages,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";

import { cn } from "../lib/utils";
import { getMyProfile, updateProfile } from "../api/users.api";
import type { UserProfileData, UpdateProfileRequest } from "../types/user.types";
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

function VerifiedIcon({ verified }: { verified: boolean }) {
  return verified ? (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-mint-100">
      <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
    </div>
  ) : (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-grayScale-100">
      <XCircle className="h-3.5 w-3.5 text-grayScale-300" />
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-grayScale-200"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-brand-500 transition-all duration-700"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-brand-600">{percent}%</span>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  extra,
  editNode,
  editing,
}: {
  icon: typeof User;
  label: string;
  value: string;
  extra?: React.ReactNode;
  editNode?: React.ReactNode;
  editing?: boolean;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-grayScale-50/80">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grayScale-100/80 text-grayScale-400 transition-colors group-hover:bg-brand-50 group-hover:text-brand-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
          {label}
        </p>
        {editing && editNode ? (
          <div className="mt-1">{editNode}</div>
        ) : (
          <div className="mt-0.5 flex items-center gap-2">
            <p className="truncate text-sm font-medium text-grayScale-700">{value || "—"}</p>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data.data);
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
    setEditForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      nick_name: profile.nick_name ?? "",
      gender: profile.gender ?? "",
      birth_day: profile.birth_day ?? "",
      age_group: profile.age_group ?? "",
      education_level: profile.education_level ?? "",
      country: profile.country ?? "",
      region: profile.region ?? "",
      occupation: profile.occupation ?? "",
      learning_goal: profile.learning_goal ?? "",
      language_goal: profile.language_goal ?? "",
      language_challange: profile.language_challange ?? "",
      favoutite_topic: profile.favoutite_topic ?? "",
      preferred_language: profile.preferred_language ?? "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(editForm);
      const res = await getMyProfile();
      setProfile(res.data.data);
      setEditing(false);
      setEditForm({});
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UpdateProfileRequest, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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
  const completionPct = profile.profile_completion_percentage ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      {/* ─── Hero Card ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-grayScale-100 bg-white shadow-sm ring-1 ring-black/5">
        {/* Tall dark gradient banner with content inside */}
        <div className="relative flex min-h-[220px] flex-col justify-between bg-gradient-to-br from-[#1a1f4e] via-[#2d2b6b] to-[#3b3480] px-6 py-8 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Hello {profile.first_name}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/70">
              Track your account status, keep profile details up to date, and manage your learning preferences from one place.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                <Shield className="h-3.5 w-3.5" />
                {profile.role}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                <Clock className="h-3.5 w-3.5" />
                Last login {formatDate(profile.last_login)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                <Target className="h-3.5 w-3.5" />
                {completionPct}% complete
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-white/30 bg-white/10 px-3 text-xs font-medium text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:text-white"
                onClick={startEditing}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-white/30 bg-white/10 px-3 text-xs text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-white text-xs text-[#1a1f4e] hover:bg-white/90"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Identity info below banner */}
        <div className="bg-gradient-to-b from-white to-grayScale-50/40 px-6 py-5 sm:px-8">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-9 w-40 text-sm font-semibold"
                value={editForm.first_name ?? ""}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="First name"
              />
              <Input
                className="h-9 w-40 text-sm font-semibold"
                value={editForm.last_name ?? ""}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Last name"
              />
              <span className="rounded-full bg-grayScale-50 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
                #{profile.id}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-grayScale-800 sm:text-2xl">
                {fullName}
              </h2>
              {profile.nick_name && (
                <span className="text-sm font-medium text-grayScale-400">
                  @{profile.nick_name}
                </span>
              )}
              <span className="rounded-full bg-grayScale-50 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
                #{profile.id}
              </span>
            </div>
          )}

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "px-2.5 py-0.5 text-xs font-semibold",
                profile.role === "ADMIN"
                  ? "bg-brand-500/10 text-brand-600 border border-brand-500/20"
                  : "bg-grayScale-50 text-grayScale-600 border border-grayScale-200",
              )}
            >
              <Shield className="mr-1 h-3 w-3" />
              {profile.role}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                profile.status === "ACTIVE"
                  ? "bg-mint-50 text-mint-600"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive",
                )}
              />
              {profile.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-grayScale-50 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
              <Calendar className="h-3 w-3" />
              Joined {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Detail Cards Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Contact & Personal ── */}
        <Card className="overflow-hidden rounded-2xl border-grayScale-100 shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
          <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />
          <CardContent className="p-0">
            <div className="grid divide-y divide-grayScale-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Contact */}
              <div className="p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-grayScale-400">
                  Contact
                </p>
                <div className="space-y-1">
                  <DetailItem
                    icon={Mail}
                    label="Email"
                    value={profile.email}
                    extra={<VerifiedIcon verified={profile.email_verified} />}
                  />
                  <DetailItem
                    icon={Phone}
                    label="Phone"
                    value={profile.phone_number}
                    extra={<VerifiedIcon verified={profile.phone_verified} />}
                  />
                  <DetailItem
                    icon={MapPin}
                    label="Location"
                    value={[profile.region, profile.country].filter(Boolean).join(", ") || "—"}
                    editing={editing}
                    editNode={
                      <div className="flex gap-2">
                        <Input
                          className="h-8 text-sm"
                          value={editForm.region ?? ""}
                          onChange={(e) => updateField("region", e.target.value)}
                          placeholder="Region"
                        />
                        <Input
                          className="h-8 text-sm"
                          value={editForm.country ?? ""}
                          onChange={(e) => updateField("country", e.target.value)}
                          placeholder="Country"
                        />
                      </div>
                    }
                  />
                  <DetailItem
                    icon={Globe}
                    label="Preferred Language"
                    value={
                      { en: "English", am: "Amharic", or: "Oromiffa", ti: "Tigrinya" }[
                        profile.preferred_language
                      ] ?? profile.preferred_language ?? "—"
                    }
                    editing={editing}
                    editNode={
                      <Select
                        className="h-8 text-sm"
                        value={editForm.preferred_language ?? ""}
                        onChange={(e) => updateField("preferred_language", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                        <option value="or">Oromiffa</option>
                        <option value="ti">Tigrinya</option>
                      </Select>
                    }
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-grayScale-400">
                  Personal
                </p>
                <div className="space-y-1">
                  <DetailItem
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(profile.birth_day)}
                    editing={editing}
                    editNode={
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={editForm.birth_day ?? ""}
                        onChange={(e) => updateField("birth_day", e.target.value)}
                      />
                    }
                  />
                  <DetailItem
                    icon={User}
                    label="Gender"
                    value={profile.gender || "Not specified"}
                    editing={editing}
                    editNode={
                      <Select
                        className="h-8 text-sm"
                        value={editForm.gender ?? ""}
                        onChange={(e) => updateField("gender", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Select>
                    }
                  />
                  <DetailItem
                    icon={User}
                    label="Age Group"
                    value={profile.age_group?.replace("_", "–") || "—"}
                    editing={editing}
                    editNode={
                      <Select
                        className="h-8 text-sm"
                        value={editForm.age_group ?? ""}
                        onChange={(e) => updateField("age_group", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="18_24">18–24</option>
                        <option value="25_34">25–34</option>
                        <option value="35_44">35–44</option>
                        <option value="45_54">45–54</option>
                        <option value="55_64">55–64</option>
                        <option value="65+">65+</option>
                      </Select>
                    }
                  />
                  <DetailItem
                    icon={Briefcase}
                    label="Occupation"
                    value={profile.occupation || "—"}
                    editing={editing}
                    editNode={
                      <Input
                        className="h-8 text-sm"
                        value={editForm.occupation ?? ""}
                        onChange={(e) => updateField("occupation", e.target.value)}
                        placeholder="Occupation"
                      />
                    }
                  />
                  <DetailItem
                    icon={BookOpen}
                    label="Education"
                    value={profile.education_level || "—"}
                    editing={editing}
                    editNode={
                      <Input
                        className="h-8 text-sm"
                        value={editForm.education_level ?? ""}
                        onChange={(e) => updateField("education_level", e.target.value)}
                        placeholder="Education level"
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Right Sidebar ── */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Profile Completion */}
          <Card className="overflow-hidden rounded-2xl border-grayScale-100 shadow-sm transition-shadow hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-brand-400 to-mint-400" />
            <CardContent className="flex items-center gap-4 p-5">
              <ProgressRing percent={completionPct} />
              <div>
                <p className="text-sm font-semibold text-grayScale-700">Profile Completion</p>
                <p className="mt-0.5 text-xs text-grayScale-400">
                  {completionPct === 100 ? "All set!" : "Complete your profile for the best experience."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="overflow-hidden rounded-2xl border-grayScale-100 shadow-sm transition-shadow hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-grayScale-300 to-grayScale-200" />
            <CardContent className="space-y-4 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-grayScale-400">
                Activity
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-grayScale-600">Last Login</p>
                  <p className="text-[11px] text-grayScale-400">{formatDateTime(profile.last_login)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-grayScale-50 text-grayScale-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-grayScale-600">Account Created</p>
                  <p className="text-[11px] text-grayScale-400">{formatDateTime(profile.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Account Info */}
          <Card className="overflow-hidden rounded-2xl border-grayScale-100 shadow-sm transition-shadow hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="space-y-3 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-grayScale-400">
                Account
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grayScale-400">Role</span>
                  <Badge
                    className={cn(
                      "text-[10px] font-semibold",
                      profile.role === "ADMIN"
                        ? "bg-brand-500/10 text-brand-600 border border-brand-500/20"
                        : "bg-grayScale-50 text-grayScale-600 border border-grayScale-200",
                    )}
                  >
                    {profile.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grayScale-400">Status</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold",
                      profile.status === "ACTIVE" ? "text-mint-600" : "text-destructive",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive",
                      )}
                    />
                    {profile.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grayScale-400">Email</span>
                  <span className="flex items-center gap-1">
                    <span className="max-w-[130px] truncate text-xs text-grayScale-600">
                      {profile.email}
                    </span>
                    <VerifiedIcon verified={profile.email_verified} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grayScale-400">Phone</span>
                  <span className="flex items-center gap-1">
                    <span className="max-w-[110px] truncate text-xs text-grayScale-600">
                      {profile.phone_number || "—"}
                    </span>
                    <VerifiedIcon verified={profile.phone_verified} />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Learning & Goals Card ─── */}
      <Card className="overflow-hidden rounded-2xl border-grayScale-100 shadow-sm transition-shadow hover:shadow-md">
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />
        <div className="border-b border-grayScale-100 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-grayScale-400">
            Learning & Preferences
          </p>
        </div>
        <CardContent className="p-0">
          <div className="grid divide-y divide-grayScale-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            <div className="p-5">
              <DetailItem
                icon={Target}
                label="Learning Goal"
                value={profile.learning_goal || "—"}
                editing={editing}
                editNode={
                  <Input
                    className="h-8 text-sm"
                    value={editForm.learning_goal ?? ""}
                    onChange={(e) => updateField("learning_goal", e.target.value)}
                    placeholder="Your learning goal"
                  />
                }
              />
            </div>
            <div className="p-5">
              <DetailItem
                icon={Languages}
                label="Language Goal"
                value={profile.language_goal || "—"}
                editing={editing}
                editNode={
                  <Input
                    className="h-8 text-sm"
                    value={editForm.language_goal ?? ""}
                    onChange={(e) => updateField("language_goal", e.target.value)}
                    placeholder="Language goal"
                  />
                }
              />
            </div>
            <div className="p-5">
              <DetailItem
                icon={MessageCircle}
                label="Language Challenge"
                value={profile.language_challange || "—"}
                editing={editing}
                editNode={
                  <Input
                    className="h-8 text-sm"
                    value={editForm.language_challange ?? ""}
                    onChange={(e) => updateField("language_challange", e.target.value)}
                    placeholder="Language challenge"
                  />
                }
              />
            </div>
            <div className="p-5">
              <DetailItem
                icon={Heart}
                label="Favourite Topic"
                value={profile.favoutite_topic || "—"}
                editing={editing}
                editNode={
                  <Input
                    className="h-8 text-sm"
                    value={editForm.favoutite_topic ?? ""}
                    onChange={(e) => updateField("favoutite_topic", e.target.value)}
                    placeholder="Favourite topic"
                  />
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
