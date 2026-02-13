import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail } from "lucide-react"

import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle forgot password logic here
    console.log("Forgot password:", { email })
    setSubmitted(true)
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Decorative left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 relative">
        {/* Abstract decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rotate-45 rounded-3xl bg-white/[0.03]" />
        </div>

        <div className="relative z-10 max-w-md px-12 text-center">
          {/* Large brand icon */}
          <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <div className="h-9 w-9 rotate-45 rounded-lg bg-white/90" />
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">
            Yimaru Academy
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            Manage your academy, track student progress, and streamline
            operations — all from one powerful dashboard.
          </p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandLogo />
          </div>

          {/* Back link */}
          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-grayScale-400 transition-colors hover:text-grayScale-600"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-100/60">
                <Mail className="h-7 w-7 text-brand-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-grayScale-600">
                Check your email
              </h1>
              <p className="mb-8 text-sm leading-relaxed text-grayScale-400">
                We've sent a password reset link to{" "}
                <span className="font-medium text-grayScale-600">{email}</span>.
                Please check your inbox and follow the instructions.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-6 text-sm font-semibold"
                onClick={() => setSubmitted(false)}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            /* Form state */
            <>
              {/* Header */}
              <div className="mb-10">
                <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-brand-400">
                  Account Recovery
                </p>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-grayScale-600">
                  Forgot password?
                </h1>
                <p className="text-sm leading-relaxed text-grayScale-400">
                  No worries — enter your email and we'll send you a reset link.
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-xl text-sm font-semibold tracking-wide"
                >
                  Send reset link
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-grayScale-400">
            © {new Date().getFullYear()} Yimaru Academy · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
