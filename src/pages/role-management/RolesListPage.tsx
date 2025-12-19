import { useNavigate } from "react-router-dom"
import { Plus, Edit } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"

const mockRoles = [
  { id: "1", name: "Admin", userCount: 10 },
  { id: "2", name: "User", userCount: 5 },
]

export function RolesListPage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grayScale-900">Role Management</h1>
        <Button
          onClick={() => navigate("/roles/add")}
          className="bg-brand-500 hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add New Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockRoles.map((role) => (
          <Card key={role.id} className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-grayScale-900">{role.name}</h3>
              <p className="mb-4 text-sm text-grayScale-600">{role.userCount} Users</p>
              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

