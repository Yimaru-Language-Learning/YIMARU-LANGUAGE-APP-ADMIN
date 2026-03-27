import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import logoSrc from "../../assets/logo.svg"

interface InfoLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  lastUpdated?: string
}

const footerLinks = [
  { to: "/about", label: "About" },
  { to: "/terms", label: "Terms and Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/account-deletion", label: "Account Deletion" },
]

export function InfoLayout({
  title,
  subtitle,
  children,
  lastUpdated = "March 11, 2026",
}: InfoLayoutProps) {
  const location = useLocation()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fefcff] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#f3e8ff]" />
      <div className="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-[#f5ecff]" />
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[#eadff7] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(83,33,120,0.08)] sm:px-10 sm:py-8">
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/about" className="inline-flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-brand-500 p-2 shadow-sm ring-1 ring-brand-400/40">
                <img src={logoSrc} alt="Yimaru Academy" className="h-8 w-auto" />
              </span>
              <p className="text-xl font-semibold text-grayScale-700">Yimaru Academy</p>
            </Link>
            <nav className="flex flex-wrap items-center text-sm font-medium">
              {footerLinks.map((item, index) => (
                <div key={item.to} className="flex items-center">
                  <Link
                    to={item.to}
                    className={`px-3 transition-colors ${
                      location.pathname === item.to
                        ? "text-[#8f56b5]"
                        : "text-grayScale-600 hover:text-[#8f56b5]"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {index < footerLinks.length - 1 && (
                    <span className="h-5 w-px bg-[#e0d8eb]" aria-hidden="true" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-bold tracking-tight text-grayScale-700">{title}</h1>
            <p className="mt-4 text-sm text-grayScale-500">
              <span className="font-semibold text-grayScale-600">Last Updated:</span> {lastUpdated}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-grayScale-500">{subtitle}</p>
          </div>
          <div className="mt-6 h-px bg-[#e8e1f2]" />
        </header>

        <main className="space-y-6 pt-6">{children}</main>

        <footer className="mt-8 flex justify-center text-xs text-grayScale-400">
          © Yimaru Academy. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
