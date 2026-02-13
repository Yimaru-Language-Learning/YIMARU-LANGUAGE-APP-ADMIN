import { ArrowLeft, FileText, Mail, Phone, Shield, User } from "lucide-react"
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
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">Register New User</h1>
          <p className="text-sm text-grayScale-400">Add a new user to the system</p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl p-6">
        <form className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
                <User className="h-4 w-4" />
                First Name
              </label>
              <Input placeholder="Enter first name" required />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
                <User className="h-4 w-4" />
                Last Name
              </label>
              <Input placeholder="Enter last name" required />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input type="email" placeholder="Enter email address" required />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Phone className="h-4 w-4" />
              Phone
            </label>
            <Input type="tel" placeholder="Enter phone number" required />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Shield className="h-4 w-4" />
              Role
            </label>
            <Select required>
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <FileText className="h-4 w-4" />
              Notes
            </label>
            <Textarea placeholder="Enter any additional notes" rows={3} />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/users")}>
              Cancel
            </Button>
            <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto">
              Register User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
