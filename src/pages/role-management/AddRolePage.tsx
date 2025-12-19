import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"

const permissions = [
  "View Dashboard",
  "Manage Users",
  "Manage Roles",
  "Manage Practices",
  "View Reports",
  "Manage Content",
  "Manage Settings",
]

export function AddRolePage() {
  const navigate = useNavigate()
  const [roleName, setRoleName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    )
  }

  const handleSubmit = () => {
    console.log("Add role:", { roleName, roleDescription, selectedPermissions })
    navigate("/roles")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roles")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-grayScale-900">Add New Role</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">Role Name</label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">
              Role Description
            </label>
            <Textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Enter role description"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="mb-4 block text-sm font-medium text-grayScale-700">
              Permissions
            </label>
            <div className="space-y-2">
              {permissions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 rounded-lg border p-3 hover:bg-grayScale-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 rounded border-grayScale-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-grayScale-700">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} className="bg-brand-500 hover:bg-brand-600">
              Add Role
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

