import { useState } from "react"
import { ArrowLeft, FileText, Mail, Phone, Shield, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { createUser } from "../../api/users.api"

export function RegisterUserPage() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !role) {
      toast.error("Missing required fields", {
        description: "Please fill in first name, last name, email, phone, and role.",
      })
      return
    }

    setSubmitting(true)
    try {
      await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        role: role.toUpperCase(),
        notes: notes.trim() || undefined,
      })

      toast.success("User registered", {
        description: `${firstName} ${lastName} has been created successfully.`,
      })

      navigate("/users")
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Failed to register user. Please check the details and try again."
      toast.error("Registration failed", {
        description: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

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
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
                <User className="h-4 w-4" />
                First Name
              </label>
              <Input
                placeholder="Enter first name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
                <User className="h-4 w-4" />
                Last Name
              </label>
              <Input
                placeholder="Enter last name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input
              type="email"
              placeholder="Enter email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Phone className="h-4 w-4" />
              Phone
            </label>
            <Input
              type="tel"
              placeholder="Enter phone number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <Shield className="h-4 w-4" />
              Role
            </label>
            <Select
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select role</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-grayScale-600">
              <FileText className="h-4 w-4" />
              Notes
            </label>
            <Textarea
              placeholder="Enter any additional notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/users")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto"
              disabled={submitting}
            >
              {submitting ? "Registering..." : "Register User"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
