import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"

export function RegisterUserPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-grayScale-900">Register New User</h1>
      </div>

      <Card className="p-6">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                First Name
              </label>
              <Input placeholder="Enter first name" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Last Name
              </label>
              <Input placeholder="Enter last name" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">Email</label>
            <Input type="email" placeholder="Enter email address" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">Phone</label>
            <Input type="tel" placeholder="Enter phone number" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">Role</label>
            <Select required>
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-grayScale-700">Notes</label>
            <Textarea placeholder="Enter any additional notes" rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/users")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-500 hover:bg-brand-600">
              Register User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

