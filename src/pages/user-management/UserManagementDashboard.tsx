import { Link } from "react-router-dom"
import { UserPlus, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

export function UserManagementDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-grayScale-900">User Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">User Register</CardTitle>
            <CardDescription>Register new users to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/users/register">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">Register User</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">User Groups</CardTitle>
            <CardDescription>Manage user groups and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/users/groups">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">View Groups</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">User List</CardTitle>
            <CardDescription>View and manage all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/users/list">
              <Button variant="outline" className="w-full">
                View All Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

