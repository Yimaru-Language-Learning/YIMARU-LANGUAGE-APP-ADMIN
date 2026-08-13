import { notifyApiError } from "../../lib/apiErrors"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Briefcase, Mail, Phone, Shield, User, Building2, Calendar } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import { createTeamMember } from "../../api/team.api"
import { toast } from "sonner"

export function AddTeamMemberPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [bio, setBio] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !role || !department || !jobTitle || !employmentType || !hireDate) {
      toast.error("Missing required fields", {
        description: "First name, last name, email, phone, role, department, job title, employment type, and hire date are required.",
      })
      return
    }

    setSubmitting(true)
    try {
      await createTeamMember({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        team_role: role,
        department,
        job_title: jobTitle,
        employment_type: employmentType,
        hire_date: hireDate,
        bio: bio.trim() || undefined,
      })

      toast.success("Team member added", {
        description: `${firstName} ${lastName} has been created successfully.`,
      })
      navigate("/team")
    } catch (err: unknown) {
      notifyApiError(err, "Failed to create team member. Please check the details and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-[6px] border border-grayScale-200 bg-white shadow-sm hover:bg-grayScale-50"
            onClick={() => navigate("/team")}
          >
            <ArrowLeft className="h-4 w-4 text-grayScale-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Add Team Member</h1>
            <p className="mt-0.5 text-sm text-grayScale-400">
              Create a new admin/team account with the right role and permissions.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Team member details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <User className="h-3.5 w-3.5" />
                  First name
                </label>
                <Input
                  placeholder="e.g. Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <User className="h-3.5 w-3.5" />
                  Last name
                </label>
                <Input
                  placeholder="e.g. Ahmed"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Phone className="h-3.5 w-3.5" />
                  Phone number
                </label>
                <Input
                  type="tel"
                  placeholder="+251..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Role & org */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Shield className="h-3.5 w-3.5" />
                  Role
                </label>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">Select role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="instructor">Instructor</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="finance">Finance</option>
                  <option value="hr">HR</option>
                  <option value="analyst">Analyst</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </label>
                <Input
                  placeholder="e.g. Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Briefcase className="h-3.5 w-3.5" />
                  Job title
                </label>
                <Input
                  placeholder="e.g. Content Lead"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Briefcase className="h-3.5 w-3.5" />
                  Employment type
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contractor">Contractor</option>
                  <option value="intern">Intern</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Hire date
                </label>
                <Input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-grayScale-600">
                <ArrowLeft className="h-3.5 w-3.5" />
                Bio / notes (optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Short description, responsibilities, or notes about this team member."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate("/team")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full bg-brand-500 text-white shadow-sm hover:bg-brand-600 sm:w-auto"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create team member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

