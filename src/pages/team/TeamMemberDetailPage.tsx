import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  KeyRound,
  Mail,
  Phone,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { getTeamMemberById } from "../../api/team.api";
import type { TeamMember } from "../../types/team.types";

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-grayScale-100" />
      <div className="animate-pulse">
        <div className="rounded-2xl bg-grayScale-100 h-64" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-grayScale-100 h-52" />
          <div className="rounded-2xl bg-grayScale-100 h-52" />
          <div className="rounded-2xl bg-grayScale-100 h-52" />
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

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-brand-400 to-mint-500" />
        <CardContent className="-mt-12 px-8 pb-8 pt-0">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-soft">
              <AvatarImage src={undefined} alt={fullName} />
              <AvatarFallback className="bg-brand-100 text-brand-600 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold text-grayScale-600">{fullName}</h1>
              <p className="mt-0.5 text-sm text-grayScale-400">{member.job_title} · {member.department}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    getRoleBadgeClasses(member.team_role)
                  )}
                >
                  <Shield className="h-3 w-3" />
                  {formatRoleLabel(member.team_role)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
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
                <span className="inline-flex items-center gap-1 rounded-full bg-grayScale-100 px-2.5 py-0.5 text-xs font-medium text-grayScale-500">
                  {formatEmploymentType(member.employment_type)}
                </span>
              </div>
            </div>
          </div>

          {member.bio && (
            <div className="mt-5 rounded-xl bg-grayScale-100 p-4 text-sm leading-relaxed text-grayScale-600">
              {member.bio}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
                <User className="h-4 w-4 text-brand-600" />
              </div>
              <CardTitle>Work Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow icon={Briefcase} label="Job Title" value={member.job_title} />
            <Separator />
            <DetailRow icon={Building2} label="Department" value={member.department} />
            <Separator />
            <DetailRow icon={Globe} label="Employment" value={formatEmploymentType(member.employment_type)} />
            <Separator />
            <DetailRow icon={Calendar} label="Hire Date" value={formatDate(member.hire_date)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100/60">
                <Mail className="h-4 w-4 text-mint-500" />
              </div>
              <CardTitle>Contact</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              icon={Mail}
              label="Email"
              value={member.email}
              extra={
                member.email_verified ? (
                  <CheckCircle2 className="h-4 w-4 text-mint-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-grayScale-300" />
                )
              }
            />
            <Separator />
            <DetailRow icon={Phone} label="Phone" value={member.phone_number} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100/60">
                <Shield className="h-4 w-4 text-gold-600" />
              </div>
              <CardTitle>Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow icon={Shield} label="Role" value={formatRoleLabel(member.team_role)} />
            <Separator />
            <DetailRow icon={Clock} label="Last Login" value={formatDateTime(member.last_login)} />
            <Separator />
            <DetailRow icon={Calendar} label="Member Since" value={formatDate(member.created_at)} />
          </CardContent>
        </Card>
      </div>

      {member.permissions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
                <KeyRound className="h-4 w-4 text-brand-600" />
              </div>
              <CardTitle>Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
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
