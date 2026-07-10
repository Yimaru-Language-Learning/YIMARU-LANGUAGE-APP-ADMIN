import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { resetTeamPassword } from "../../api/team.api"
import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { mapTeamPasswordResetError } from "../../lib/teamPasswordReset"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailFromQuery = searchParams.get("email")?.trim() ?? ""
  const otpFromQuery = searchParams.get("otp")?.trim() ?? ""

  const [email, setEmail] = useState(emailFromQuery)
  const [otp, setOtp] = useState(otpFromQuery)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLinkParams = Boolean(emailFromQuery && otpFromQuery)
  const emailLocked = Boolean(emailFromQuery)
  const otpLocked = Boolean(otpFromQuery)

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && otp.trim().length > 0 && password.length >= 8
  }, [email, otp, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !otp.trim()) {
      setError("Email and reset code are required. Open the link from your email or request a new one.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      await resetTeamPassword({
        email: email.trim(),
        otp: otp.trim(),
        password,
      })
      toast.success("Password reset successfully", {
        description: "Sign in with your new password.",
      })
      navigate("/login?reset=1", { replace: true })
    } catch (err) {
      setError(mapTeamPasswordResetError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex h-dvh overflow-y-auto">
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 max-w-md px-12 text-center">
          <BrandLogo variant="light" className="mx-auto mb-8 h-16" />
          <p className="text-base leading-relaxed text-white/70">
            Choose a strong password to secure your admin account.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandLogo />
          </div>

          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-grayScale-400 transition-colors hover:text-grayScale-600"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>

          <div className="mb-8">
            <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-brand-400">
              Account Recovery
            </p>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-grayScale-600">
              Reset password
            </h1>
            <p className="text-sm leading-relaxed text-grayScale-400">
              {hasLinkParams
                ? "Set a new password for your team account. This link expires in 5 minutes."
                : "Enter the email and code from your reset email, then choose a new password."}
            </p>
          </div>

          {!hasLinkParams ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Missing reset link details. You can enter them manually, or{" "}
              <Link to="/forgot-password" className="font-semibold underline">
                request a new link
              </Link>
              .
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="mb-1.5 block text-sm font-medium text-grayScale-600"
              >
                Email address
              </label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={emailLocked}
                required
                autoComplete="email"
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label
                htmlFor="reset-otp"
                className="mb-1.5 block text-sm font-medium text-grayScale-600"
              >
                Reset code
              </label>
              <Input
                id="reset-otp"
                type={otpLocked ? "password" : "text"}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                readOnly={otpLocked}
                required
                autoComplete="one-time-code"
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label
                htmlFor="reset-password"
                className="mb-1.5 block text-sm font-medium text-grayScale-600"
              >
                New password
              </label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={submitting}
                  className="h-11 rounded-xl pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-grayScale-400">At least 8 characters</p>
            </div>

            <div>
              <label
                htmlFor="reset-confirm"
                className="mb-1.5 block text-sm font-medium text-grayScale-600"
              >
                Confirm password
              </label>
              <Input
                id="reset-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>

            {error ? (
              <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p>{error}</p>
                {(error.toLowerCase().includes("expired") ||
                  error.toLowerCase().includes("already used") ||
                  error.toLowerCase().includes("invalid reset")) && (
                  <Link
                    to="/forgot-password"
                    className="inline-block font-semibold text-red-800 underline"
                  >
                    Request a new reset link
                  </Link>
                )}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              className="mt-2 h-11 w-full rounded-xl text-sm font-semibold tracking-wide"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon className="h-4 w-4" />
                  Saving…
                </span>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-grayScale-400">
            © {new Date().getFullYear()} Yimaru Academy · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
