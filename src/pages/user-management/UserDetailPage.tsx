import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  RefreshCw,
  Target,
  UserPlus,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { useUsersStore } from "../../zustand/userStore";
import { getUserById, getUserRecentActivity } from "../../api/users.api";
import { getCourseCategories, getCoursesByCategory } from "../../api/courses.api";
import {
  getAdminLearnerCourseProgress,
  getAdminLearnerCourseProgressSummary,
} from "../../api/progress.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Select } from "../../components/ui/select";
import { SpinnerIcon } from "../../components/ui/spinner-icon";
import type { LearnerCourseProgressItem, LearnerCourseProgressSummary } from "../../types/progress.types";
import type { Course } from "../../types/course.types";
import type { UserRecentActivityItem } from "../../types/user.types";

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

/** Matches Recent Activity mock: "Today, 10:27 AM" / "Yesterday, 3:45 PM" / "Jan 10, 2025". */
function formatActivityOccurredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86_400_000);

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dayDiff === 0) return `Today, ${timePart}`;
  if (dayDiff === 1) return `Yesterday, ${timePart}`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type CourseOption = Course & { category_name: string };

export function UserDetailPage() {
  const { id } = useParams();
  const userProfile = useUsersStore((s) => s.userProfile);
  const setUserProfile = useUsersStore((s) => s.setUserProfile);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loadingCourseOptions, setLoadingCourseOptions] = useState(false);
  const [selectedProgressCourseId, setSelectedProgressCourseId] = useState<number | null>(null);
  const [progressItems, setProgressItems] = useState<LearnerCourseProgressItem[]>([]);
  const [progressSummary, setProgressSummary] = useState<LearnerCourseProgressSummary | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [recentActivityItems, setRecentActivityItems] = useState<UserRecentActivityItem[]>([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const res = await getUserById(Number(id));
        setUserProfile(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setUserProfile(null);
      }
    };
    fetchUser();
  }, [id, setUserProfile]);

  useEffect(() => {
    const loadCourseOptions = async () => {
      setLoadingCourseOptions(true);
      try {
        const categoriesRes = await getCourseCategories();
        const categories = categoriesRes.data?.data?.categories ?? [];
        const options: CourseOption[] = [];

        for (const category of categories) {
          const coursesRes = await getCoursesByCategory(category.id);
          const courses = coursesRes.data?.data?.courses ?? [];
          options.push(
            ...courses.map((course) => ({
              ...course,
              category_name: category.name,
            })),
          );
        }

        setCourseOptions(options);
        if (options.length > 0 && !selectedProgressCourseId) {
          setSelectedProgressCourseId(options[0].id);
        }
      } catch {
        setCourseOptions([]);
      } finally {
        setLoadingCourseOptions(false);
      }
    };

    loadCourseOptions();
  }, []);

  useEffect(() => {
    if (!id || !selectedProgressCourseId) return;

    const userId = Number(id);
    if (Number.isNaN(userId)) return;

    const loadProgress = async () => {
      setLoadingProgress(true);
      setProgressError(null);
      try {
        const [summaryRes, detailRes] = await Promise.all([
          getAdminLearnerCourseProgressSummary(userId, selectedProgressCourseId),
          getAdminLearnerCourseProgress(userId, selectedProgressCourseId),
        ]);

        setProgressSummary(summaryRes.data?.data ?? null);
        const ordered = [...(detailRes.data?.data ?? [])].sort(
          (a, b) => a.display_order - b.display_order || a.sub_course_id - b.sub_course_id,
        );
        setProgressItems(ordered);
      } catch (err: any) {
        setProgressSummary(null);
        setProgressItems([]);
        const status = err?.response?.status;
        if (status === 403) {
          setProgressError("Missing permission: progress.get_any_user");
        } else if (status === 400) {
          setProgressError("Invalid learner or course selection.");
        } else {
          setProgressError(err?.response?.data?.message || "Failed to load learner progress.");
        }
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [id, selectedProgressCourseId]);

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);
    if (Number.isNaN(userId)) return;

    const loadRecent = async () => {
      setRecentActivityLoading(true);
      try {
        const res = await getUserRecentActivity(userId);
        const items = res.data?.data?.items ?? [];
        setRecentActivityItems(items);
      } catch (err) {
        console.error("Failed to load recent activity", err);
        setRecentActivityItems([]);
      } finally {
        setRecentActivityLoading(false);
      }
    };

    loadRecent();
  }, [id]);

  const progressMetrics = useMemo(() => {
    if (progressSummary) {
      return {
        total: progressSummary.total_sub_courses ?? 0,
        completed: progressSummary.completed_sub_courses ?? 0,
        inProgress: progressSummary.in_progress_sub_courses ?? 0,
        locked: progressSummary.locked_sub_courses ?? 0,
        averageProgress: Math.round(progressSummary.overall_progress_percentage ?? 0),
      };
    }

    const total = progressItems.length;
    const completed = progressItems.filter((item) => item.progress_status === "COMPLETED").length;
    const inProgress = progressItems.filter((item) => item.progress_status === "IN_PROGRESS").length;
    const locked = progressItems.filter((item) => item.is_locked).length;
    const averageProgress =
      total === 0
        ? 0
        : Math.round(
            progressItems.reduce((sum, item) => sum + Number(item.progress_percentage || 0), 0) / total,
          );

    return { total, completed, inProgress, locked, averageProgress };
  }, [progressItems, progressSummary]);

  if (!userProfile) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 py-12">
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <div className="h-16 w-16 rounded-full bg-grayScale-100 flex items-center justify-center">
              <Target className="h-8 w-8 text-grayScale-300" />
            </div>
            <div className="text-lg font-semibold text-grayScale-600">
              User not found
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/users/list">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = userProfile;
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();

  const infoFields = [
    { icon: Phone, label: "Phone", value: user.phone_number },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Globe, label: "Country", value: user.country || "Ethiopia" },
    { icon: MapPin, label: "Region", value: user.region },
  ];

  const statusVariant = (status: LearnerCourseProgressItem["progress_status"]) => {
    if (status === "COMPLETED") return "success" as const;
    if (status === "IN_PROGRESS") return "warning" as const;
    return "secondary" as const;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/users/list"
          className="inline-flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Profile card */}
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400" />
            <CardContent className="-mt-12 space-y-5 px-4 sm:px-6 pb-6 pt-0">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-soft">
                  <AvatarImage src={user.profile_picture_url ?? undefined} alt={fullName} />
                  <AvatarFallback className="bg-brand-100 text-brand-600 text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg font-semibold text-grayScale-600">
                  {fullName}
                </h2>
                <Badge
                  className={cn(
                    "mt-1.5",
                    user.status === "ACTIVE"
                      ? "bg-mint-500/15 text-mint-500 border border-mint-500/25"
                      : "bg-destructive/15 text-destructive border border-destructive/25"
                  )}
                >
                  {user.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                {infoFields.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100">
                      <Icon className="h-4 w-4 text-grayScale-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                        {label}
                      </div>
                      <div className="truncate text-sm text-grayScale-600">
                        {value || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayScale-100">
                  <Calendar className="h-4 w-4 text-grayScale-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                    Joined
                  </div>
                  <div className="text-sm text-grayScale-600">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Subscription</CardTitle>
                <Badge
                  className={cn(
                    user.status === "ACTIVE"
                      ? "bg-mint-500/15 text-mint-500 border border-mint-500/25"
                      : "bg-destructive/15 text-destructive border border-destructive/25"
                  )}
                >
                  {user.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-grayScale-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-grayScale-400">
                    Plan
                  </span>
                  <span className="text-sm font-semibold text-grayScale-600">6-Month</span>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-grayScale-400">
                    Expires
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-grayScale-600">Nov 13, 2025</span>
                    <Badge className="bg-gold-100 text-gold-600 text-[10px] border border-gold-300">
                      3 days left
                    </Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend Subscription
              </Button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button variant="outline" className="w-full text-sm">
                  Mark as Paid
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm text-destructive border-destructive/40 hover:bg-destructive/5"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Learning profile */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
                  <GraduationCap className="h-4 w-4 text-brand-600" />
                </div>
                <CardTitle>Learning Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <InfoItem
                  label="Education Level"
                  value={user.education_level || "Undergraduate"}
                />
                <InfoItem
                  label="Age Group"
                  value={user.age ? `${user.age} years` : "25-34"}
                />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400 mb-1">
                    Proficiency
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-grayScale-600">Intermediate</span>
                    <span className="inline-flex h-5 items-center rounded-md bg-brand-100/60 px-1.5 text-[11px] font-semibold text-brand-600">
                      B1
                    </span>
                  </div>
                </div>
                <InfoItem
                  label="Preferred Topic"
                  value={user.favoutite_topic || "Business"}
                />
                <TagItem label="Learning Path" value={user.learning_goal || "Business English"} />
                <TagItem label="Challenge" value={user.language_challange || "Speaking"} />
              </div>

              <Separator />

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400 mb-2">
                  Primary Goal
                </div>
                <div className="rounded-xl bg-grayScale-100 p-4 text-sm leading-relaxed text-grayScale-600">
                  {user.learning_goal ||
                    "Improve business communication skills for professional advancement"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learner course progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/70">
                    <BarChart3 className="h-4 w-4 text-sky-600" />
                  </div>
                  <CardTitle>Learner Course Progress</CardTitle>
                </div>
                <div className="w-full sm:w-72">
                  <Select
                    value={selectedProgressCourseId ? String(selectedProgressCourseId) : ""}
                    onChange={(e) =>
                      setSelectedProgressCourseId(e.target.value ? Number(e.target.value) : null)
                    }
                    disabled={loadingCourseOptions || courseOptions.length === 0}
                  >
                    <option value="">
                      {loadingCourseOptions ? "Loading course sub-categories..." : "Select course sub-category..."}
                    </option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.category_name})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Total Sub-courses" value={progressMetrics.total} />
                <Metric label="Completed" value={progressMetrics.completed} />
                <Metric label="In Progress" value={progressMetrics.inProgress} />
                <Metric label="Locked" value={progressMetrics.locked} />
                <Metric label="Avg Progress" value={`${progressMetrics.averageProgress}%`} />
              </div>

              {progressError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {progressError}
                </div>
              )}

              {!progressError && loadingProgress && (
                <div className="flex items-center gap-2 rounded-lg border border-grayScale-200 bg-grayScale-100 px-3 py-2 text-xs text-grayScale-500">
                  <SpinnerIcon className="h-3.5 w-3.5" />
                  Loading learner progress...
                </div>
              )}

              {!progressError && !loadingProgress && selectedProgressCourseId && progressItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-grayScale-200 px-3 py-5 text-center text-xs text-grayScale-400">
                  No learner progress records found for this course sub-category.
                </div>
              )}

              {!progressError && !loadingProgress && progressItems.length > 0 && (
                <div className="overflow-x-auto rounded-xl border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressItems.map((item) => (
                        <TableRow key={item.sub_course_id}>
                          <TableCell className="min-w-[220px]">
                            <div className="flex items-start gap-2">
                              {item.is_locked && <Lock className="mt-0.5 h-3.5 w-3.5 text-gold-600" />}
                              <div>
                                <p className="text-sm font-medium text-grayScale-700">{item.title}</p>
                                {item.description && (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-grayScale-400">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.level}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(item.progress_status)}>{item.progress_status}</Badge>
                          </TableCell>
                          <TableCell className="min-w-[170px]">
                            <div className="space-y-1">
                              <div className="h-2 w-full rounded-full bg-grayScale-200">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all",
                                    item.progress_status === "COMPLETED"
                                      ? "bg-mint-500"
                                      : item.progress_status === "IN_PROGRESS"
                                        ? "bg-gold-600"
                                        : "bg-grayScale-300",
                                  )}
                                  style={{
                                    width: `${Math.min(100, Math.max(0, item.progress_percentage || 0))}%`,
                                  }}
                                />
                              </div>
                              <p className="text-[11px] text-grayScale-500">{item.progress_percentage}%</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-grayScale-500">
                            {formatDateTime(item.started_at)}
                          </TableCell>
                          <TableCell className="text-xs text-grayScale-500">
                            {formatDateTime(item.completed_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100/60">
                  <BookOpen className="h-4 w-4 text-gold-600" />
                </div>
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivityLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-grayScale-400">
                  <SpinnerIcon className="h-5 w-5" />
                  Loading activity…
                </div>
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
                        {!isLast && (
                          <div className="absolute bottom-0 left-[15px] top-8 w-px bg-grayScale-200" />
                        )}
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
                          <div className="text-sm font-medium text-grayScale-600">{item.headline}</div>
                          <div className="mt-0.5 text-xs text-grayScale-400">
                            {formatActivityOccurredAt(item.occurred_at)}
                          </div>
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
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400 mb-1">
        {label}
      </div>
      <div className="text-sm text-grayScale-600">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-grayScale-700">{value}</div>
    </div>
  );
}

function TagItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400 mb-1">
        {label}
      </div>
      <span className="inline-block rounded-lg border border-grayScale-200 bg-grayScale-100 px-2.5 py-1 text-xs font-medium text-grayScale-600">
        {value}
      </span>
    </div>
  );
}
