import { useState, useCallback } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "../components/sidebar/Sidebar"
import { Topbar } from "../components/topbar/Topbar"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const token = localStorage.getItem("access_token")
  if (!token) {
    return <Navigate to="/login" replace />
  }

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex min-h-screen bg-grayScale-100">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[264px]">
        <Topbar onMenuClick={handleMenuClick} />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 lg:px-6">
          <Outlet />
        </main>
        <footer className="border-t bg-grayScale-50 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-grayScale-400">
            <span>Powered by</span>
            <a
              href="https://yaltopia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-500 transition-colors hover:text-brand-600"
            >
              Yaltopia
            </a>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
