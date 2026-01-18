import { useEffect } from "react";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { useUsersStore } from "../../zustand/userStore";
import { getUserById } from "../../api/users.api";

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
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="text-sm font-semibold text-grayScale-500">User Detail</div>
        <Card className="overflow-hidden shadow-sm">
          <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
          <CardContent className="p-6 space-y-4">
            <div className="text-lg font-semibold text-grayScale-900">User not found</div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/users/list">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = userProfile;
  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-grayScale-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <div className="text-xl font-semibold text-grayScale-900">User Detail</div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-1">
          {/* Basic Information */}
          <Card className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-grayScale-200 flex items-center justify-center overflow-hidden">
                  {user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={fullName}
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-12 w-12 text-grayScale-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-grayScale-900">{fullName}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-grayScale-400">
                    <span>ID: {user.id}</span>
                    <span className="h-1 w-1 rounded-full bg-grayScale-300" />
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          user.status === "ACTIVE" ? "bg-mint-500" : "bg-destructive"
                        )}
                      />
                      {user.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-grayScale-600">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Phone</div>
                  <div className="font-semibold">{user.phone_number || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Email</div>
                  <div className="font-semibold">{user.email || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Region</div>
                  <div className="font-semibold">{user.region || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Joined Date</div>
                  <div className="font-semibold">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-grayScale-900">Subscription</div>
                <Badge
                  className={cn(
                    user.status === "ACTIVE" ? "bg-mint-500 text-white" : "bg-destructive text-white"
                  )}
                >
                  {user.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-grayScale-600">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Profile Completed</div>
                  <div className="font-semibold">{user.profile_completed ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Preferred Language</div>
                  <div className="font-semibold">{user.preferred_language || "-"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Learning Profile */}
          <Card className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Education Level</div>
                  <div className="text-sm font-semibold text-grayScale-600">{user.education_level || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Age</div>
                  <div className="text-sm font-semibold text-grayScale-600">{user.age || "-"}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Nick Name</div>
                  <div className="text-sm font-semibold text-grayScale-600">{user.nick_name || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Occupation</div>
                  <div className="text-sm font-semibold text-grayScale-600">{user.occupation || "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-grayScale-400">Learning Goal</div>
                <div className="text-sm font-semibold text-grayScale-600">{user.learning_goal || "-"}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-grayScale-400">Language Challenge</div>
                <div className="text-sm font-semibold text-grayScale-600">{user.language_challange || "-"}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-grayScale-400">Favourite Topic</div>
                <div className="text-sm font-semibold text-grayScale-600">{user.favoutite_topic || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status / Dates */}
          <Card className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6 space-y-3 text-sm text-grayScale-600">
              <div>
                <div className="text-xs font-semibold text-grayScale-400">Last Login</div>
                <div className="font-semibold">{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-grayScale-400">Updated At</div>
                <div className="font-semibold">{user.updated_at ? new Date(user.updated_at).toLocaleString() : "-"}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
