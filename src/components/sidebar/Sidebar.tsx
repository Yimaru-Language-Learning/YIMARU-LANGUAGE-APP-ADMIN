import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
import { type ComponentType, useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"
import { BrandLogo } from "../brand/BrandLogo"
import { getUnreadCount } from "../../api/notifications.api"

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
  isCollapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}

export function Sidebar({ isOpen, isCollapsed, onToggleCollapse, onClose }: SidebarProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount()
        setUnreadCount(res.data.unread)
      } catch {
        // silently fail
      }
    }

    fetchUnread()

    window.addEventListener("notifications-updated", fetchUnread)
    return () => window.removeEventListener("notifications-updated", fetchUnread)
  }, [])

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
          "group fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-grayScale-50 py-5 transition-all duration-300",
          "w-[264px] px-4 lg:translate-x-0",
          isCollapsed && "lg:w-[88px] lg:px-2",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("flex items-center justify-between px-2", isCollapsed && "justify-center")}>
          {isCollapsed ? (
            <span className="h-10 w-10 overflow-hidden">
              <BrandLogo className="h-10 w-auto max-w-none" />
            </span>
          ) : (
            <BrandLogo />
          )}
          <button
            type="button"
            className={cn(
              "hidden h-8 w-8 place-items-center rounded-lg text-grayScale-500 transition-opacity hover:bg-grayScale-100 hover:text-brand-600 lg:grid lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto",
              isCollapsed && "translate-x-2",
            )}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
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
                    isCollapsed && "justify-center px-2",
                    "hover:bg-grayScale-100 hover:text-brand-600",
                    isActive &&
                      "bg-brand-100/40 text-brand-600 shadow-[0_1px_0_rgba(0,0,0,0.02)] ring-1 ring-brand-100",
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "relative grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition group-hover:bg-brand-100 group-hover:text-brand-600",
                        isActive && "bg-brand-500 text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {isCollapsed && item.to === "/notifications" && unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                      )}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && item.to === "/notifications" && unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {!isCollapsed && item.to !== "/notifications" && isActive ? (
                      <span className="ml-auto h-6 w-1 rounded-full bg-brand-500" />
                    ) : !isCollapsed && item.to === "/notifications" && unreadCount === 0 && isActive ? (
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
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600",
              isCollapsed && "justify-center px-2",
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  )
}
