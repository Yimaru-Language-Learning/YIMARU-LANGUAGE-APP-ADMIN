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
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
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
    <div className="group flex flex-col gap-1 rounded-lg px-3 py-3 transition-colors hover:bg-grayScale-100/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-grayScale-400">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100 text-grayScale-400 transition-colors group-hover:bg-brand-100 group-hover:text-brand-500">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-grayScale-600 sm:justify-end min-w-0">
        <span className="truncate text-right sm:text-left">{value || "—"}</span>
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
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 44 44">
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
      <span className="absolute text-[9px] font-bold text-brand-600">{percent}%</span>
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
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Page header (no tabs) */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">My Info</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-grayScale-800">Profile</h1>
      </div>

      {/* Main profile layout card */}
      <div className="rounded-2xl border border-grayScale-100 bg-white shadow-sm">
        {/* Header strip */}
        <div className="border-b border-grayScale-100 px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">Overview</p>
              <p className="mt-1 text-sm text-grayScale-500">
                Personal, job and account details for this team member.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_minmax(0,1.2fr)]">
            {/* Left column: About & details */}
            <div className="space-y-6">
              {/* Identity */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Avatar className="h-16 w-16 sm:h-18 sm:w-18">
                  <AvatarImage src={profile.profile_picture_url || undefined} alt={fullName} />
                  <AvatarFallback className="bg-grayScale-100 text-base font-semibold text-grayScale-600">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-grayScale-800">{fullName}</h2>
                    <span className="rounded-full bg-grayScale-50 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
                      #{profile.id}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "px-2.5 py-0.5 text-xs font-semibold",
                        profile.role === "ADMIN"
                          ? "bg-brand-500/10 text-brand-600 border border-brand-500/20"
                          : "bg-grayScale-50 text-grayScale-600 border border-grayScale-200"
                      )}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {profile.role}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grayScale-50 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(profile.created_at)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        profile.status === "ACTIVE"
                          ? "bg-mint-50 text-mint-600"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive"
                        )}
                      />
                      {profile.status}
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/60 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
                      <ProgressRing percent={completionPct} />
                      <span>Profile complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About / Contact */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  About
                </h3>
                <div className="space-y-1.5 rounded-xl border border-grayScale-100 bg-grayScale-50/60 px-3 py-3">
                  <InfoRow icon={Phone} label="Phone" value={profile.phone_number} extra={<VerifiedIcon verified={profile.phone_verified} />} />
                  <InfoRow icon={Mail} label="Email" value={profile.email} extra={<VerifiedIcon verified={profile.email_verified} />} />
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={[profile.region, profile.country].filter(Boolean).join(", ") || "—"}
                  />
                </div>
              </div>

              {/* Employee details */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Employee details
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm text-grayScale-500">
                  <div>
                    <dt className="text-grayScale-400">Date of birth</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {formatDate(profile.birth_day)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grayScale-400">Age</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {profile.age ? `${profile.age} years` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grayScale-400">Gender</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {profile.gender || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grayScale-400">Age group</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {profile.age_group || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grayScale-400">Occupation</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {profile.occupation || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grayScale-400">Preferred language</dt>
                    <dd className="mt-0.5 font-medium text-grayScale-700">
                      {profile.preferred_language || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Middle column: Job information */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Job information
                </h3>
                <div className="overflow-x-auto rounded-xl border border-grayScale-100">
                  <table className="w-full min-w-[600px] border-collapse text-sm">
                    <thead className="bg-grayScale-50 text-xs font-medium uppercase tracking-[0.12em] text-grayScale-400">
                      <tr>
                        <th className="px-4 py-2 text-left">Title</th>
                        <th className="px-4 py-2 text-left">Team</th>
                        <th className="px-4 py-2 text-left">Division</th>
                        <th className="px-4 py-2 text-left">Manager</th>
                        <th className="px-4 py-2 text-left">Hire date</th>
                        <th className="px-4 py-2 text-left">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
                      <tr>
                        <td className="px-4 py-3">{profile.occupation || profile.role}</td>
                        <td className="px-4 py-3">{profile.role}</td>
                        <td className="px-4 py-3">{profile.preferred_language || "—"}</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">{formatDate(profile.created_at)}</td>
                        <td className="px-4 py-3">
                          {[profile.region, profile.country].filter(Boolean).join(", ") || "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Learning & goals */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-none border-grayScale-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-grayScale-700">
                      Learning goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <p className="text-sm text-grayScale-500">
                      {profile.learning_goal || "No learning goal specified."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-none border-grayScale-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-grayScale-700">
                      Language goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <p className="text-sm text-grayScale-500">
                      {profile.language_goal || "No language goal specified."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column: Activity & account summary */}
            <div className="space-y-6">
              {/* Activity */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Activity
                </h3>
                <Card className="shadow-none border-grayScale-100">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-grayScale-700">
                            Last login
                          </p>
                          <p className="text-xs text-grayScale-400">
                            {formatDateTime(profile.last_login)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-grayScale-50 text-grayScale-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-grayScale-700">
                          Account created
                        </p>
                        <p className="text-xs text-grayScale-400">
                          {formatDateTime(profile.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account summary */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
                  Account
                </h3>
                <Card className="shadow-none border-grayScale-100">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grayScale-400">Role</span>
                      <span className="font-medium text-grayScale-700">{profile.role}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grayScale-400">Status</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold",
                          profile.status === "ACTIVE"
                            ? "text-mint-600"
                            : "text-destructive"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive"
                          )}
                        />
                        {profile.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grayScale-400">Email</span>
                      <span className="flex items-center gap-1 text-grayScale-700">
                        <span className="truncate max-w-[140px] text-right text-xs sm:text-sm">
                          {profile.email}
                        </span>
                        <VerifiedIcon verified={profile.email_verified} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grayScale-400">Phone</span>
                      <span className="flex items-center gap-1 text-grayScale-700">
                        <span className="truncate max-w-[120px] text-right text-xs sm:text-sm">
                          {profile.phone_number || "—"}
                        </span>
                        <VerifiedIcon verified={profile.phone_verified} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
