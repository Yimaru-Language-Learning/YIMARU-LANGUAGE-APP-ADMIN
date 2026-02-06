import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  XCircle,
  Briefcase,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
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
    <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
      <div className="animate-pulse">
        <div className="rounded-2xl bg-grayScale-100 h-72" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-grayScale-100 h-56" />
          <div className="rounded-2xl bg-grayScale-100 h-56" />
          <div className="rounded-2xl bg-grayScale-100 h-56" />
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
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 text-sm text-grayScale-400">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-grayScale-600">
        <span>{value || "—"}</span>
        {extra}
      </div>
    </div>
  );
}

function VerifiedIcon({ verified }: { verified: boolean }) {
  return verified ? (
    <CheckCircle2 className="h-4 w-4 text-mint-500" />
  ) : (
    <XCircle className="h-4 w-4 text-grayScale-300" />
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
      <div className="mx-auto w-full max-w-5xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="h-16 w-16 rounded-full bg-grayScale-100 flex items-center justify-center">
              <User className="h-8 w-8 text-grayScale-300" />
            </div>
            <div className="text-lg font-semibold text-grayScale-600">
              {error || "Profile not available"}
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
    <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />
        <CardContent className="-mt-14 px-8 pb-8 pt-0">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-soft">
              <AvatarImage src={profile.profile_picture_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-brand-100 text-brand-600 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h1 className="mt-4 text-2xl font-bold text-grayScale-600">{fullName}</h1>

            <Badge
              className={cn(
                "mt-2",
                profile.role === "ADMIN"
                  ? "bg-brand-500/15 text-brand-600 border border-brand-500/25"
                  : "bg-grayScale-200 text-grayScale-600"
              )}
            >
              <Shield className="h-3 w-3 mr-1" />
              {profile.role}
            </Badge>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  profile.status === "ACTIVE"
                    ? "bg-mint-100 text-mint-500"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive"
                  )}
                />
                {profile.status}
              </div>

              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  profile.email_verified
                    ? "bg-mint-100 text-mint-500"
                    : "bg-grayScale-100 text-grayScale-400"
                )}
              >
                {profile.email_verified ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Email {profile.email_verified ? "Verified" : "Unverified"}
              </div>

              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  profile.phone_verified
                    ? "bg-mint-100 text-mint-500"
                    : "bg-grayScale-100 text-grayScale-400"
                )}
              >
                {profile.phone_verified ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Phone {profile.phone_verified ? "Verified" : "Unverified"}
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-brand-100/60 px-3 py-1.5 text-xs font-medium text-brand-600">
                <GraduationCap className="h-3 w-3" />
                Profile {completionPct}% Complete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-brand-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={User} label="Full Name" value={fullName} />
            <Separator />
            <InfoRow icon={User} label="Gender" value={profile.gender || "Not specified"} />
            <Separator />
            <InfoRow icon={Calendar} label="Birthday" value={formatDate(profile.birth_day)} />
            <Separator />
            <InfoRow icon={User} label="Age Group" value={profile.age_group || "—"} />
            <Separator />
            <InfoRow icon={Briefcase} label="Occupation" value={profile.occupation || "—"} />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-brand-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              icon={Mail}
              label="Email"
              value={profile.email}
              extra={<VerifiedIcon verified={profile.email_verified} />}
            />
            <Separator />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={profile.phone_number}
              extra={<VerifiedIcon verified={profile.phone_verified} />}
            />
            <Separator />
            <InfoRow icon={Globe} label="Country" value={profile.country || "—"} />
            <Separator />
            <InfoRow icon={MapPin} label="Region" value={profile.region || "—"} />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-brand-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Shield} label="Role" value={profile.role} />
            <Separator />
            <InfoRow
              icon={Languages}
              label="Language"
              value={profile.preferred_language || "—"}
            />
            <Separator />
            <InfoRow
              icon={Clock}
              label="Last Login"
              value={formatDateTime(profile.last_login)}
            />
            <Separator />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={formatDate(profile.created_at)}
            />
            <Separator />
            <InfoRow
              icon={CheckCircle2}
              label="Status"
              value={profile.status}
              extra={
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    profile.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive"
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
