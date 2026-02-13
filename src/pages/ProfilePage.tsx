import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  // GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  XCircle,
  Briefcase,
  // RefreshCw,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { cn } from "../lib/utils";
import { getMyProfile } from "../api/users.api";
import type { UserProfileData } from "../types/user.types";

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
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="animate-pulse space-y-8">
        {/* Hero skeleton */}
        <div className="overflow-hidden rounded-2xl border border-grayScale-100">
          <div className="h-36 bg-gradient-to-r from-grayScale-100 via-grayScale-200/60 to-grayScale-100" />
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
        {/* Info cards skeleton */}
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

function InfoRow({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: typeof User;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="group flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-grayScale-100/60">
      <div className="flex items-center gap-3 text-sm text-grayScale-400">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100 text-grayScale-400 transition-colors group-hover:bg-brand-100 group-hover:text-brand-500">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-grayScale-600">
        <span className="text-right">{value || "—"}</span>
        {extra}
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
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-grayScale-200"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
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

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingSkeleton />;

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
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
  const completionPct = profile.profile_completion_percentage ?? 0;

  const sectionCardIcons: Record<string, { icon: typeof User; color: string }> = {
    personal: { icon: User, color: "from-brand-500 to-brand-600" },
    contact: { icon: Mail, color: "from-brand-400 to-brand-500" },
    account: { icon: Shield, color: "from-brand-600 to-brand-500" },
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Hero Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Banner gradient */}
        <div className="relative h-36 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 sm:h-40">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/20 to-transparent" />
        </div>

        <CardContent className="-mt-16 px-6 pb-8 pt-0 sm:px-10">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <Avatar className="h-28 w-28 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile.profile_picture_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-br from-brand-100 to-brand-200 text-2xl font-bold text-brand-600">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-grayScale-600 sm:text-3xl">
              {fullName}
            </h1>

            {/* Role badge */}
            <Badge
              className={cn(
                "mt-2.5 px-3 py-1",
                profile.role === "ADMIN"
                  ? "bg-brand-500/10 text-brand-600 border border-brand-500/20"
                  : "bg-grayScale-100 text-grayScale-600 border border-grayScale-200"
              )}
            >
              <Shield className="h-3 w-3 mr-1.5" />
              {profile.role}
            </Badge>

            {/* Status pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {/* Active status */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  profile.status === "ACTIVE"
                    ? "border-mint-300 bg-mint-100/60 text-mint-500"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    profile.status === "ACTIVE" ? "bg-mint-500 animate-pulse" : "bg-destructive"
                  )}
                />
                {profile.status}
              </div>

              {/* Email verification */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  profile.email_verified
                    ? "border-mint-300 bg-mint-100/60 text-mint-500"
                    : "border-grayScale-200 bg-grayScale-100/60 text-grayScale-400"
                )}
              >
                {profile.email_verified ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Email {profile.email_verified ? "Verified" : "Unverified"}
              </div>

              {/* Phone verification */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  profile.phone_verified
                    ? "border-mint-300 bg-mint-100/60 text-mint-500"
                    : "border-grayScale-200 bg-grayScale-100/60 text-grayScale-400"
                )}
              >
                {profile.phone_verified ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Phone {profile.phone_verified ? "Verified" : "Unverified"}
              </div>

              {/* Profile completion ring */}
              <div className="flex items-center gap-2 rounded-full border border-brand-200 bg-brand-100/30 px-3 py-1 text-xs font-semibold text-brand-600">
                <ProgressRing percent={completionPct} />
                <span>Profile Complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Information */}
        <Card className="group overflow-hidden border border-grayScale-100 transition-all duration-200 hover:shadow-lg">
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-600" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
                Personal Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3 pb-4">
            <InfoRow icon={User} label="Full Name" value={fullName} />
            <InfoRow icon={User} label="Gender" value={profile.gender || "Not specified"} />
            <InfoRow icon={Calendar} label="Birthday" value={formatDate(profile.birth_day)} />
            <InfoRow icon={User} label="Age Group" value={profile.age_group || "—"} />
            <InfoRow icon={Briefcase} label="Occupation" value={profile.occupation || "—"} />
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card className="group overflow-hidden border border-grayScale-100 transition-all duration-200 hover:shadow-lg">
          <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-brand-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-white shadow-sm">
                <Mail className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
                Contact & Location
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3 pb-4">
            <InfoRow
              icon={Mail}
              label="Email"
              value={profile.email}
              extra={<VerifiedIcon verified={profile.email_verified} />}
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={profile.phone_number}
              extra={<VerifiedIcon verified={profile.phone_verified} />}
            />
            <InfoRow icon={Globe} label="Country" value={profile.country || "—"} />
            <InfoRow icon={MapPin} label="Region" value={profile.region || "—"} />
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="group overflow-hidden border border-grayScale-100 transition-all duration-200 hover:shadow-lg">
          <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-brand-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
                Account Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3 pb-4">
            <InfoRow icon={Shield} label="Role" value={profile.role} />
            <InfoRow
              icon={Languages}
              label="Language"
              value={profile.preferred_language || "—"}
            />
            <InfoRow
              icon={Clock}
              label="Last Login"
              value={formatDateTime(profile.last_login)}
            />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={formatDate(profile.created_at)}
            />
            <InfoRow
              icon={CheckCircle2}
              label="Status"
              value={profile.status}
              extra={
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full ring-2",
                    profile.status === "ACTIVE"
                      ? "bg-mint-500 ring-mint-100"
                      : "bg-destructive ring-destructive/20"
                  )}
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
