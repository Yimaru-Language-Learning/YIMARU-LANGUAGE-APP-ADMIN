import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  Users,
  Users2,
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
  { label: "Content Management", to: "/content", icon: BookOpen },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "User Log", to: "/user-log", icon: ClipboardList },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Team Management", to: "/team", icon: Users2 },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
]

export function Sidebar() {
  return (
    <aside className="flex w-[264px] flex-col border-r bg-grayScale-50 px-4 py-5">
      <div className="px-2">
        <BrandLogo />
      </div>

      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
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

      <div className="mt-auto px-2 pt-6">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}


