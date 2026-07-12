import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import successSrc from "../../assets/success.svg"
import { sendTeamPasswordReset } from "../../api/team.api"
import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { mapTeamPasswordResetError } from "../../lib/teamPasswordReset"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError("Email is required.")
      return
    }

    setSubmitting(true)
    try {
      await sendTeamPasswordReset({ email: trimmed })
      setSubmitted(true)
      toast.success("Reset link sent", {
        description: "Check your email. The link expires in 5 minutes.",
      })
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
          <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rotate-45 rounded-3xl bg-white/[0.03]" />
        </div>

        <div className="relative z-10 max-w-md px-12 text-center">
          <BrandLogo variant="light" className="mx-auto mb-8 h-16" />
          <p className="text-base leading-relaxed text-white/70">
            Manage your academy, track student progress, and streamline
            operations — all from one powerful dashboard.
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

          {submitted ? (
            <div className="text-center">
              <img src={successSrc} alt="" className="mx-auto mb-6 h-20 w-20" />
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-grayScale-600">
                Check your email
              </h1>
              <p className="mb-8 text-sm leading-relaxed text-grayScale-400">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-grayScale-600">{email.trim()}</span>.
                The link expires in 5 minutes — open it promptly to set a new password.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-6 text-sm font-semibold"
                onClick={() => {
                  setSubmitted(false)
                  setError(null)
                }}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-brand-400">
                  Account Recovery
                </p>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-grayScale-600">
                  Forgot password?
                </h1>
                <p className="text-sm leading-relaxed text-grayScale-400">
                  Enter your team email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-grayScale-600"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError(null)
                    }}
                    required
                    autoComplete="email"
                    disabled={submitting}
                    className="h-11 rounded-xl"
                  />
                </div>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-11 w-full rounded-xl text-sm font-semibold tracking-wide"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <SpinnerIcon className="h-4 w-4" />
                      Sending…
                    </span>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-xs text-grayScale-400">
            © {new Date().getFullYear()} Yimaru Academy · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
