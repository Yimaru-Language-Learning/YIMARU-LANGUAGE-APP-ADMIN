import { useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Globe,
  GraduationCap,
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
import { getUserById } from "../../api/users.api";

const activityIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  started: PlayCircle,
  joined: UserPlus,
};

export function UserDetailPage() {
  const { id } = useParams();
  const userProfile = useUsersStore((s) => s.userProfile);
  const setUserProfile = useUsersStore((s) => s.setUserProfile);

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

  const recentActivities = [
    { type: "completed", text: "Completed Unit 4: Business Emails", time: "Today, 10:27 AM" },
    { type: "completed", text: "Completed Unit 3: Formal Writing", time: "Yesterday, 3:45 PM" },
    { type: "started", text: "Started Learning Path: Business English", time: "Jan 15, 2025" },
    { type: "joined", text: "Joined Yimaru", time: "Jan 10, 2025" },
  ];

  const infoFields = [
    { icon: Phone, label: "Phone", value: user.phone_number },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Globe, label: "Country", value: user.country || "Ethiopia" },
    { icon: MapPin, label: "Region", value: user.region },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/users"
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
              <div className="relative space-y-0">
                {recentActivities.map((activity, index) => {
                  const Icon = activityIcons[activity.type] ?? CheckCircle2;
                  const isLast = index === recentActivities.length - 1;
                  return (
                    <div key={index} className="relative flex gap-4 pb-5 last:pb-0">
                      {!isLast && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-grayScale-200" />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          activity.type === "completed"
                            ? "bg-mint-100 text-mint-500"
                            : activity.type === "started"
                              ? "bg-brand-100/50 text-brand-500"
                              : "bg-grayScale-100 text-grayScale-400"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="text-sm font-medium text-grayScale-600">
                          {activity.text}
                        </div>
                        <div className="mt-0.5 text-xs text-grayScale-400">{activity.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
