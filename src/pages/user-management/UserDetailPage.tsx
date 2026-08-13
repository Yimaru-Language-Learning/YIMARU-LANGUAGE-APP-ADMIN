import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  PlayCircle,
  Target,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import {
  getUserById,
  getUserLearningActivity,
  getUserRecentActivity,
  getUserSubscriptions,
  updateUserStatus,
  type UserStatus,
} from "../../api/users.api";
import { getApiErrorMessage, notifyApiError } from "../../lib/apiErrors";
import { toast } from "sonner";
import { SpinnerIcon } from "../../components/ui/spinner-icon";
import type { UserProfileData, UserRecentActivityItem } from "../../types/user.types";
import type { UserLearningActivityData, UserSubscriptionsData } from "../../types/userAdmin.types";
import { UserLearningActivitySection } from "./components/UserLearningActivitySection";
import { UserAccountActivitySection } from "./components/UserAccountActivitySection";
import { UserSubscriptionsSection } from "./components/UserSubscriptionsSection";
import { DisplayValue, NOT_ASSIGNED_LABEL, UnassignedLabel, displayValue, isUnassignedLabel } from "../../lib/displayValue"
import {
  displayUserAgeGroup,
  displayUserOccupation,
  displayUserRegion,
  displayUserEducationLevel,
  displayUserLearningGoal,
  displayUserLanguageChallenge,
  displayUserLanguageGoal,
  displayUserFavouriteTopic,
  displayUserCountry,
} from "../../lib/userProfileFieldDisplay"

const activityIcons = {
  completed: CheckCircle2,
  started: PlayCircle,
  joined: UserPlus,
  default: BookOpen,
} as const;

function visualActivityKind(kind: string): keyof typeof activityIcons {
  const k = kind.toLowerCase();
  if (k === "completed" || k === "complete") return "completed";
  if (k === "started" || k === "start") return "started";
  if (k === "joined" || k === "join") return "joined";
  return "default";
}

function formatRoleLabel(role: string): string {
  const value = role.trim();
  if (!value) return NOT_ASSIGNED_LABEL;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatStatusLabel(status: string): string {
  const value = status.trim();
  if (!value) return NOT_ASSIGNED_LABEL;
  const normalized = value.toUpperCase();
  if (normalized === "DEACTIVATED") return "Inactive";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return NOT_ASSIGNED_LABEL;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null, emptyLabel = NOT_ASSIGNED_LABEL): string {
  if (!value?.trim()) return emptyLabel;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_ASSIGNED_LABEL;
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityOccurredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unassigned";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86_400_000);

  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dayDiff === 0) return `Today, ${timePart}`;
  if (dayDiff === 1) return `Yesterday, ${timePart}`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAccountStatusClasses(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") {
    return "bg-mint-500/15 text-mint-500 border border-mint-500/25";
  }
  return "bg-destructive/15 text-destructive border border-destructive/25";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-grayScale-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-2xl bg-grayScale-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-grayScale-100" />
        </div>
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl bg-grayScale-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-grayScale-100" />
        </div>
      </div>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [learningActivity, setLearningActivity] = useState<UserLearningActivityData | null>(null);
  const [learningActivityLoading, setLearningActivityLoading] = useState(false);
  const [learningActivityError, setLearningActivityError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionsData | null>(null);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [recentActivityItems, setRecentActivityItems] = useState<UserRecentActivityItem[]>([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);
  const [recentActivityError, setRecentActivityError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    nextStatus: UserStatus;
  } | null>(null);

  useEffect(() => {
    const userId = Number(id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setUserError("Invalid user ID.");
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      setLoadingUser(true);
      setUserError(null);
      try {
        const res = await getUserById(userId);
        setUser(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setUser(null);
        setUserError("User not found.");
      } finally {
        setLoadingUser(false);
      }
    };

    void fetchUser();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);
    if (Number.isNaN(userId)) return;

    const loadLearningActivity = async () => {
      setLearningActivityLoading(true);
      setLearningActivityError(null);
      try {
        const res = await getUserLearningActivity(userId);
        setLearningActivity(res.data.data);
      } catch (err) {
        console.error("Failed to load learning activity", err);
        setLearningActivity(null);
        setLearningActivityError(getApiErrorMessage(err, "Failed to load learning activity."));
      } finally {
        setLearningActivityLoading(false);
      }
    };

    void loadLearningActivity();
  }, [id]);

  const refreshSubscriptions = async () => {
    const userId = Number(id);
    if (!Number.isFinite(userId) || userId <= 0) return;

    setSubscriptionsLoading(true);
    setSubscriptionsError(null);
    try {
      const res = await getUserSubscriptions(userId);
      setSubscriptions(res.data.data);
    } catch (err) {
      console.error("Failed to load subscriptions", err);
      setSubscriptions(null);
      setSubscriptionsError(getApiErrorMessage(err, "Failed to load subscriptions."));
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);
    if (Number.isNaN(userId)) return;
    void refreshSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);
    if (Number.isNaN(userId)) return;

    const loadRecent = async () => {
      setRecentActivityLoading(true);
      setRecentActivityError(null);
      try {
        const res = await getUserRecentActivity(userId);
        const items = [...(res.data.data.items ?? [])].sort(
          (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
        );
        setRecentActivityItems(items);
      } catch (err) {
        console.error("Failed to load recent activity", err);
        setRecentActivityItems([]);
        setRecentActivityError(getApiErrorMessage(err, "Failed to load recent activity."));
      } finally {
        setRecentActivityLoading(false);
      }
    };

    void loadRecent();
  }, [id]);

  const handleStatusToggleClick = () => {
    if (!user || updatingStatus) return;
    const isCurrentlyActive = user.status === "ACTIVE";
    const nextStatus: UserStatus = isCurrentlyActive ? "DEACTIVATED" : "ACTIVE";
    setConfirmDialog({ nextStatus });
  };

  const handleConfirmStatusUpdate = async () => {
    if (!user || !confirmDialog) return;
    const { nextStatus } = confirmDialog;
    const nextActive = nextStatus === "ACTIVE";
    const previousStatus = user.status;

    setUpdatingStatus(true);
    setUser((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    try {
      await updateUserStatus({ user_id: user.id, status: nextStatus });
      toast.success(`User ${nextActive ? "activated" : "set to inactive"} successfully`);
    } catch (err: unknown) {
      setUser((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      notifyApiError(err, "Failed to update user status");
    } finally {
      setUpdatingStatus(false);
      setConfirmDialog(null);
    }
  };

  if (loadingUser) return <LoadingSkeleton />;

  if (userError || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 py-12">
        <Link
          to="/users/list"
          className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grayScale-100">
              <Target className="h-8 w-8 text-grayScale-300" />
            </div>
            <p className="text-lg font-semibold text-grayScale-600">{userError || "User not found"}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/users/list">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const profilePicture = user.profile_picture_url?.trim() || undefined;
  const isActive = user.status === "ACTIVE";

  const contactFields = [
    { icon: Mail, label: "Email", value: displayValue(user.email) },
    { icon: Globe, label: "Country", value: displayUserCountry(user.country) },
    { icon: MapPin, label: "Region", value: displayUserRegion(user.region) },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/users/list"
        className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Learners</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">{fullName}</h1>
          <p className="mt-1 text-sm text-grayScale-500">
            User #{user.id} · {formatRoleLabel(user.role)}
          </p>
        </div>
        <Button
          variant={isActive ? "destructive" : "outline"}
          onClick={handleStatusToggleClick}
          disabled={updatingStatus}
        >
          {updatingStatus ? "Updating..." : isActive ? "Block User" : "Unblock User"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden shadow-soft">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  {profilePicture ? <AvatarImage src={profilePicture} alt={fullName} /> : null}
                  <AvatarFallback className="bg-brand-100 text-lg font-semibold text-brand-600">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-grayScale-800">{fullName}</h2>
                  {user.nick_name.trim() ? (
                    <p className="text-sm text-grayScale-500">@{user.nick_name.trim()}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className={cn(getAccountStatusClasses(user.status))}>
                      {formatStatusLabel(user.status)}
                    </Badge>
                    <Badge variant={user.email_verified ? "default" : "outline"}>
                      {user.email_verified ? "Email verified" : "Email unverified"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {contactFields.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100">
                      <Icon className="h-4 w-4 text-grayScale-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase leading-tight tracking-wider text-grayScale-400">
                        {label}
                      </p>
                      <p className="truncate text-sm leading-snug text-grayScale-700">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow label="Joined" value={formatDate(user.created_at)} />
                <InfoRow label="Last login" value={formatDateTime(user.last_login, "Never")} />
                <InfoRow label="Gender" value={<DisplayValue value={user.gender} />} />
                <InfoRow label="Occupation" value={displayUserOccupation(user.occupation)} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Phone verified"
                value={user.phone_verified ? "Verified" : "Not verified"}
              />
              <InfoRow
                label="Profile completed"
                value={user.profile_completed ? "Yes" : "No"}
              />
              <InfoRow
                label="Profile completion"
                value={`${user.profile_completion_percentage}%`}
              />
              <InfoRow
                label="Preferred language"
                value={<DisplayValue value={user.preferred_language} />}
              />
            </CardContent>
          </Card>

          <UserSubscriptionsSection
            userId={Number(id)}
            userRole={user.role}
            userName={[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
            subscriptions={subscriptions}
            loading={subscriptionsLoading}
            error={subscriptionsError}
            onRefresh={() => void refreshSubscriptions()}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
                  <GraduationCap className="h-4 w-4 text-brand-600" />
                </div>
                <CardTitle className="text-base">Learning profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <InfoItem label="Education level" value={displayUserEducationLevel(user.education_level)} />
                <InfoItem label="Age group" value={displayUserAgeGroup(user.age_group)} />
                <InfoItem label="Favorite topic" value={displayUserFavouriteTopic(user.favoutite_topic)} />
                <InfoItem label="Language goal" value={displayUserLanguageGoal(user.language_goal)} />
                <InfoItem label="Challenge" value={displayUserLanguageChallenge(user.language_challange)} />
                <InfoItem label="Role" value={formatRoleLabel(user.role)} />
              </div>

              <Separator />
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                  Learning goal
                </p>
                <div className="rounded-xl bg-grayScale-100 p-4 text-sm leading-relaxed text-grayScale-700">
                  {displayUserLearningGoal(user.learning_goal)}
                </div>
              </div>
            </CardContent>
          </Card>

          <UserLearningActivitySection
            activity={learningActivity}
            loading={learningActivityLoading}
            error={learningActivityError}
          />

          <UserAccountActivitySection userId={user.id} />

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100/60">
                  <BookOpen className="h-4 w-4 text-gold-600" />
                </div>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivityLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-grayScale-400">
                  <SpinnerIcon className="h-5 w-5" />
                  Loading activity…
                </div>
              ) : recentActivityError ? (
                <p className="py-8 text-center text-sm text-destructive">{recentActivityError}</p>
              ) : recentActivityItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-grayScale-400">No recent activity yet.</p>
              ) : (
                <div className="relative space-y-0">
                  {recentActivityItems.map((item, index) => {
                    const vk = visualActivityKind(item.kind);
                    const Icon = activityIcons[vk];
                    const isLast = index === recentActivityItems.length - 1;
                    return (
                      <div key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
                        {!isLast ? (
                          <div className="absolute bottom-0 left-[15px] top-8 w-px bg-grayScale-200" />
                        ) : null}
                        <div
                          className={cn(
                            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            vk === "completed"
                              ? "bg-mint-100 text-mint-500"
                              : vk === "started"
                                ? "bg-brand-100/50 text-brand-500"
                                : vk === "joined"
                                  ? "bg-grayScale-100 text-grayScale-400"
                                  : "bg-grayScale-100 text-grayScale-500",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-sm font-medium text-grayScale-700">{item.headline}</p>
                          <p className="mt-0.5 text-xs text-grayScale-400">
                            {formatActivityOccurredAt(item.occurred_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Confirm Status Change</h2>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="grid h-8 w-8 place-items-center rounded-[6px] text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold">{fullName || "this user"}</span> to{" "}
                <span className="font-semibold">
                  {confirmDialog.nextStatus === "DEACTIVATED" ? "Inactive" : "Active"}
                </span>
                ?
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                className="bg-brand-600 text-white hover:bg-brand-500"
                onClick={handleConfirmStatusUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">{label}</p>
      <p className="text-sm text-grayScale-700">
        {typeof value === "string" && isUnassignedLabel(value) ? <UnassignedLabel /> : value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <span className="shrink-0 text-grayScale-500">{label}:</span>
      <span className="min-w-0 font-medium text-grayScale-700">
        {typeof value === "string" && isUnassignedLabel(value) ? <UnassignedLabel /> : value}
      </span>
    </div>
  );
}
