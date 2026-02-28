import { NavLink, Outlet } from "react-router-dom"
import { cn } from "../../lib/utils"

const tabs = [
  { label: "Overview", to: "/content" },
  { label: "Courses", to: "/content/courses" },
  { label: "Flows", to: "/content/flows" },
  { label: "Speaking", to: "/content/speaking" },
  { label: "Practice", to: "/content/practices" },
  { label: "Questions", to: "/content/questions" },
]

export function ContentManagementLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-1 rounded-full bg-gradient-to-b from-brand-500 to-brand-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
              Content Management
            </h1>
            <p className="mt-0.5 text-sm text-grayScale-400">
              Manage courses, speaking exercises, practices, and questions
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="scroll-hide mb-8 flex items-center gap-1 overflow-x-auto rounded-2xl border border-grayScale-100 bg-grayScale-50/60 p-1.5 shadow-sm backdrop-blur"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.scroll-hide::-webkit-scrollbar { display: none; }`}</style>
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/content"}
            className={({ isActive }) =>
              cn(
                "relative whitespace-nowrap rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 ease-in-out",
                "text-grayScale-500 hover:bg-white/80 hover:text-brand-600 hover:shadow-sm",
                isActive &&
                  "bg-brand-500 text-white shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:text-white",
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  )
}
