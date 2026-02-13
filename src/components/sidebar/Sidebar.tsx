import {
  BarChart3,
  Bell,
  BookOpen,
  CircleAlert,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Shield,
  UserCircle2,
  Users,
  Users2,
  X,
} from "lucide-react"
import type { ComponentType } from "react"
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"
import { BrandLogo } from "../brand/BrandLogo"

type NavItem = {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "User Management", to: "/users", icon: Users },
  { label: "Role Management", to: "/roles", icon: Shield },
  { label: "Content Management", to: "/content", icon: BookOpen },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "User Log", to: "/user-log", icon: ClipboardList },
  { label: "Issue Reports", to: "/issues", icon: CircleAlert },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Team Management", to: "/team", icon: Users2 },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
]

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[264px] flex-col border-r bg-grayScale-50 px-4 py-5 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <BrandLogo />
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grayScale-600 transition",
                    "hover:bg-grayScale-100 hover:text-brand-600",
                    isActive &&
                      "bg-brand-100/40 text-brand-600 shadow-[0_1px_0_rgba(0,0,0,0.02)] ring-1 ring-brand-100",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition group-hover:bg-brand-100 group-hover:text-brand-600",
                        isActive && "bg-brand-500 text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto h-6 w-1 rounded-full bg-brand-500" />
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-2 pt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.clear()
              window.location.href = "/login"
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
