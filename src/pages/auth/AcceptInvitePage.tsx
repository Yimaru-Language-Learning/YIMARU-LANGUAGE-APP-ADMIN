import { useCallback, useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"
import {
  acceptTeamInvitation,
  parseVerifyInvitation,
  verifyTeamInvitation,
} from "../../api/team.api"
import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  formatInvitationExpiry,
  formatTeamRoleLabel,
  getInvalidInvitationDescription,
  getInvalidInvitationTitle,
} from "../../lib/teamInvitation"
import type { VerifyInvitationData } from "../../types/teamInvitation.types"

export function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""

  const [verifyState, setVerifyState] = useState<
    "loading" | "invalid" | "ready" | "success"
  >("loading")
  const [inviteInfo, setInviteInfo] = useState<VerifyInvitationData | null>(null)
  const [invalidTitle, setInvalidTitle] = useState("")
  const [invalidDescription, setInvalidDescription] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [department, setDepartment] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadVerification = useCallback(async () => {
    if (!token) {
      setInviteInfo(null)
      setInvalidTitle("This invitation link is invalid")
      setInvalidDescription("Invitation link is missing a token.")
      setVerifyState("invalid")
      return
    }

    setVerifyState("loading")
    setInviteInfo(null)
    try {
      const res = await verifyTeamInvitation(token)
      const data = parseVerifyInvitation(res)

      if (!data || data.valid !== true) {
        setInviteInfo(data)
        setInvalidTitle(getInvalidInvitationTitle(data))
        setInvalidDescription(
          getInvalidInvitationDescription(data, res.data?.message),
        )
        setVerifyState("invalid")
        return
      }

      setInviteInfo(data)
      setFirstName(data.first_name?.trim() ?? "")
      setLastName(data.last_name?.trim() ?? "")
      setVerifyState("ready")
    } catch (e: unknown) {
      setInviteInfo(null)
      setInvalidTitle("This invitation link is invalid")
      setInvalidDescription(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
          "The link may be expired, invalid, or already used. Ask your administrator to send a new invitation.",
      )
      setVerifyState("invalid")
    }
  }, [token])

  useEffect(() => {
    void loadVerification()
  }, [loadVerification])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setSubmitting(true)
    try {
      const res = await acceptTeamInvitation({
        token,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        department: department.trim(),
        job_title: jobTitle.trim(),
      })
      setVerifyState("success")
      toast.success(res.data?.message ?? "Account setup complete. You can sign in now.")
      navigate("/login", { replace: true })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to complete setup"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const expiryLabel = formatInvitationExpiry(inviteInfo?.expires_at)
  const setupTitle = inviteInfo?.needs_profile_setup
    ? "Complete your account setup"
    : "Set your password"

  if (localStorage.getItem("access_token")) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 h-[500px] w-[500px] rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 max-w-md px-12 text-center">
          <BrandLogo variant="light" className="mx-auto mb-8 h-16" />
          <p className="text-base leading-relaxed text-white/70">
            You have been invited to join the Yimaru admin panel. Verify your invitation,
            then complete setup to activate your account.
          </p>
        </div>
      </div>

      <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-white px-6 py-6 lg:w-1/2 lg:py-8 xl:w-[45%]">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[440px] flex-col">
          <div className="shrink-0">
            <div className="mb-6 flex justify-center lg:hidden">
              <BrandLogo />
            </div>

            <div className="mb-4 lg:mb-6">
              <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-brand-400">
                Team invitation
              </p>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-grayScale-600 sm:text-3xl">
                {verifyState === "success"
                  ? "You're all set"
                  : verifyState === "invalid"
                    ? invalidTitle
                    : "Accept invitation"}
              </h1>
              <p className="text-sm leading-relaxed text-grayScale-400">
                {verifyState === "success"
                  ? "Redirecting you to sign in…"
                  : verifyState === "invalid"
                    ? invalidDescription
                    : verifyState === "ready"
                      ? setupTitle
                      : "Verifying your invitation link…"}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1",
              verifyState === "ready" ? "overflow-y-auto overscroll-contain" : "flex flex-col justify-center",
            )}
          >
          {verifyState === "loading" && (
            <div className="flex flex-col items-center gap-3 py-16">
              <SpinnerIcon className="h-8 w-8" />
              <p className="text-sm text-grayScale-400">Verifying invitation…</p>
            </div>
          )}

          {verifyState === "invalid" && (
            <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="space-y-2 text-sm text-red-800">
                  <p className="font-semibold">{invalidTitle}</p>
                  <p>{invalidDescription}</p>
                  <p className="text-xs text-red-700/90">
                    Common reasons: expired, invalid, or already used.
                  </p>
                </div>
              </div>
              {inviteInfo?.email ? (
                <p className="border-t border-red-200/80 pt-3 text-xs text-red-700/80">
                  Invitation email: <span className="font-medium">{inviteInfo.email}</span>
                </p>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 bg-white"
                onClick={() => void loadVerification()}
              >
                Try again
              </Button>
            </div>
          )}

          {verifyState === "ready" && inviteInfo && (
            <form
              onSubmit={(e) => void handleAccept(e)}
              className="space-y-5 pr-1 pb-4"
            >
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  readOnly
                  value={inviteInfo.email ?? ""}
                  className="cursor-not-allowed bg-grayScale-50 text-grayScale-700"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Role
                </label>
                <Input
                  id="invite-role"
                  readOnly
                  value={formatTeamRoleLabel(inviteInfo.team_role)}
                  className="cursor-not-allowed bg-grayScale-50 text-grayScale-700"
                />
              </div>

              {expiryLabel ? (
                <p className="text-xs text-grayScale-400">
                  Invitation expires {expiryLabel}
                  {inviteInfo.status ? ` · Status: ${inviteInfo.status}` : null}
                </p>
              ) : null}

              <div className="border-t border-grayScale-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                  Your details
                </p>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                      >
                        <User className="h-3.5 w-3.5" />
                        First name
                      </label>
                      <Input
                        id="first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        autoComplete="given-name"
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                      >
                        <User className="h-3.5 w-3.5" />
                        Last name
                      </label>
                      <Input
                        id="last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        autoComplete="family-name"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Phone number
                      <span className="font-normal text-grayScale-400">(optional)</span>
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+251..."
                      autoComplete="tel"
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="department"
                        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Department
                        <span className="font-normal text-grayScale-400">(optional)</span>
                      </label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. LMS"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="job-title"
                        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-grayScale-600"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        Job title
                        <span className="font-normal text-grayScale-400">(optional)</span>
                      </label>
                      <Input
                        id="job-title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Content Lead"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-grayScale-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                  Account password
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-medium text-grayScale-600"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-grayScale-600"
                    >
                      Confirm password
                    </label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-brand-500 text-white hover:bg-brand-600"
                disabled={submitting}
              >
                {submitting ? "Completing setup…" : "Complete account setup"}
              </Button>
            </form>
          )}

          {verifyState === "success" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <SpinnerIcon className="h-6 w-6" />
              <p className="text-sm text-grayScale-500">Taking you to sign in…</p>
            </div>
          )}
          </div>

          <p className="shrink-0 border-t border-grayScale-100 pt-4 text-center text-sm text-grayScale-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
