import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { cn } from "../../lib/utils"
import { useUsersStore } from "../../stores/usersStore"

export function UserDetailPage() {
  const { id } = useParams()
  const user = useUsersStore((s) => (id ? s.getUserById(id) : undefined))

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 text-sm font-semibold text-grayScale-500">User Detail</div>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>User not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/users">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-grayScale-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <div className="mb-4 text-sm font-semibold text-grayScale-500">User Detail</div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-grayScale-200" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-grayScale-600">{user.fullName}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-grayScale-500">
                    <span>ID: {user.id}</span>
                    <span className="h-1 w-1 rounded-full bg-grayScale-300" />
                    <span className="inline-flex items-center gap-1">
                      <span className={cn("h-2 w-2 rounded-full", user.isActive ? "bg-mint-500" : "bg-grayScale-300")} />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Phone</div>
                  <div className="font-medium text-grayScale-600">{user.phone}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Email</div>
                  <div className="font-medium text-grayScale-600">{user.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Region</div>
                  <div className="font-medium text-grayScale-600">{user.region}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Joined Date</div>
                  <div className="font-medium text-grayScale-600">{user.joinedDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Subscription</CardTitle>
                <Badge className={cn(user.isActive ? "bg-mint-500" : "bg-destructive")}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-grayScale-400">Current Plan</div>
                <div className="text-sm font-semibold text-grayScale-600">{user.currentPlan}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-grayScale-400">Expires On</div>
                <div className="flex items-center gap-2 text-sm font-semibold text-grayScale-600">
                  {user.expiresOn}
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-600">
                    {user.daysLeftLabel}
                  </span>
                </div>
              </div>

              <Button className="w-full">Extend Subscription</Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  Mark as Paid
                </Button>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Learning Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Education Level</div>
                  <div className="mt-1 text-sm font-semibold text-grayScale-600">{user.learningProfile.educationLevel}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Age Group</div>
                  <div className="mt-1 text-sm font-semibold text-grayScale-600">{user.learningProfile.ageGroup}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="text-xs font-semibold text-grayScale-400">Current Proficiency</div>
                <Badge variant="secondary" className="border-brand-200 bg-brand-100/50 text-brand-600">
                  {user.learningProfile.currentProficiency}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Preferred Topic</div>
                  <div className="mt-1 text-sm font-semibold text-grayScale-600">{user.learningProfile.preferredTopic}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-grayScale-400">Primary Goal</div>
                  <div className="mt-2 rounded-lg border bg-white px-3 py-2 text-sm text-grayScale-600">
                    {user.learningProfile.primaryGoal}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-grayScale-400">Challenges</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.learningProfile.challenges.map((c) => (
                    <Badge key={c} variant="secondary">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      a.dotColor === "brand" ? "bg-brand-500" : "bg-grayScale-300",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-grayScale-600">{a.text}</div>
                    <div className="text-xs text-grayScale-400">{a.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


