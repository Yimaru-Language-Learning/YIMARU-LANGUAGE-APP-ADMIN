import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  MessageCircle,
  Shield,
  User,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { getTeamMemberById } from "../../api/team.api";
import type { TeamMember } from "../../types/team.types";

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatEmploymentType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case "super_admin":
      return "bg-brand-500/15 text-brand-600 border border-brand-500/25";
    case "admin":
      return "bg-brand-100 text-brand-600 border border-brand-200";
    case "content_manager":
      return "bg-mint-100 text-mint-500 border border-mint-300/40";
    case "instructor":
      return "bg-gold-100 text-gold-600 border border-gold-300/40";
    case "support_agent":
      return "bg-orange-100 text-orange-600 border border-orange-200";
    case "finance":
      return "bg-sky-100 text-sky-600 border border-sky-200";
    case "hr":
      return "bg-pink-100 text-pink-600 border border-pink-200";
    case "analyst":
      return "bg-violet-100 text-violet-600 border border-violet-200";
    default:
      return "bg-grayScale-100 text-grayScale-600 border border-grayScale-200";
  }
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-grayScale-400">
        {label}
      </label>
      <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-2.5 text-sm text-grayScale-600">
        {value || "—"}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-grayScale-100" />
      <div className="animate-pulse">
        <div className="rounded-2xl bg-grayScale-100 h-[200px]" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-grayScale-100 h-96" />
          <div className="rounded-2xl bg-grayScale-100 h-96" />
        </div>
      </div>
    </div>
  );
}

export function TeamMemberDetailPage() {
  const { id } = useParams();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      try {
        const res = await getTeamMemberById(Number(id));
        setMember(res.data.data);
      } catch (err) {
        console.error("Failed to fetch team member", err);
        setError("Team member not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !member) {
    return (
      <div className="space-y-6">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="h-16 w-16 rounded-full bg-grayScale-100 flex items-center justify-center">
              <User className="h-8 w-8 text-grayScale-300" />
            </div>
            <div className="text-lg font-semibold text-grayScale-600">
              {error || "Member not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${member.first_name} ${member.last_name}`;
  const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team
      </Link>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1f4e] via-[#2d2b6b] to-[#3b3480] px-6 py-12 sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Hello {member.first_name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            This is the profile page. You can see the progress made with their
            work and manage their projects or assigned tasks
          </p>
          <Button className="mt-5 rounded-full bg-brand-600 px-6 hover:bg-brand-500">
            Edit profile
          </Button>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-20 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: My Account Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">My account</CardTitle>
            <Button
              size="sm"
              className="rounded-full bg-brand-600 px-5 hover:bg-brand-500"
            >
              Settings
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Information */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                User Information
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Username" value={member.email} />
                <ReadOnlyField label="Email address" value={member.email} />
                <ReadOnlyField label="First name" value={member.first_name} />
                <ReadOnlyField label="Last name" value={member.last_name} />
                <ReadOnlyField label="Job Title" value={member.job_title} />
                <ReadOnlyField label="Department" value={member.department} />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                Contact Information
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Phone" value={member.phone_number} />
                <ReadOnlyField
                  label="Employment Type"
                  value={formatEmploymentType(member.employment_type)}
                />
              </div>
            </div>

            {/* About Me */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                About Me
              </h4>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-3 text-sm leading-relaxed text-grayScale-600">
                {member.bio || "—"}
              </div>
            </div>

            {/* Permissions */}
            {member.permissions.length > 0 && (
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                  <KeyRound className="h-3.5 w-3.5" />
                  Permissions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      className="bg-grayScale-100 text-grayScale-600 border border-grayScale-200 font-mono text-xs"
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Profile Card */}
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            {/* Avatar with gradient ring */}
            <div className="relative mt-2">
              <div className="rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-mint-500 p-1">
                <Avatar className="h-28 w-28 ring-4 ring-white">
                  <AvatarImage src={undefined} alt={fullName} />
                  <AvatarFallback className="bg-brand-100 text-brand-600 text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <h3 className="mt-4 text-lg font-bold text-grayScale-600">
              {fullName}
            </h3>
            <p className="text-sm text-grayScale-400">{member.job_title}</p>

            {/* Action buttons */}
            <div className="mt-5 flex w-full gap-3">
              <Button className="flex-1 rounded-full bg-mint-500 text-white hover:bg-mint-300">
                Connect
              </Button>
              <Button className="flex-1 rounded-full bg-grayScale-600 text-white hover:bg-grayScale-500">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid w-full grid-cols-3 divide-x divide-grayScale-200 text-center">
              <div className="px-2">
                <p className="text-xs font-medium text-grayScale-400">Role</p>
                <p className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      getRoleBadgeClasses(member.team_role)
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    {formatRoleLabel(member.team_role)}
                  </span>
                </p>
              </div>
              <div className="px-2">
                <p className="text-xs font-medium text-grayScale-400">Status</p>
                <p className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      member.status === "active"
                        ? "bg-mint-100 text-mint-500"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        member.status === "active" ? "bg-mint-500" : "bg-destructive"
                      )}
                    />
                    {member.status === "active" ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="px-2">
                <p className="text-xs font-medium text-grayScale-400">Type</p>
                <p className="mt-1 text-xs font-medium text-grayScale-600">
                  {formatEmploymentType(member.employment_type)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
