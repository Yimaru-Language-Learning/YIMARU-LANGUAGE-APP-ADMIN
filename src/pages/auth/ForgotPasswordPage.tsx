import { useState } from "react"
import { Link } from "react-router-dom"
import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle forgot password logic here
    console.log("Forgot password:", { email })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grayScale-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <div className="mb-8">
            <BrandLogo />
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-semibold text-grayScale-600">Forgot Password</h1>
            <p className="text-sm text-grayScale-400">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-grayScale-600">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yimaruacademy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

