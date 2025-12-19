import { NavLink, Outlet } from "react-router-dom"
import { cn } from "../../lib/utils"

const tabs = [
  { label: "Overview", to: "/content" },
  { label: "Courses", to: "/content/courses" },
  { label: "Speaking", to: "/content/speaking" },
  { label: "Practice", to: "/content/practices" },
]

export function ContentManagementLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">Content Management</div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white p-1">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/content"}
            className={({ isActive }) =>
              cn(
                "rounded-lg px-4 py-2 text-sm font-semibold text-grayScale-500 transition",
                "hover:text-brand-600",
                isActive && "bg-brand-500 text-white hover:text-white",
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}


