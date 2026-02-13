import { useState, useCallback } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "../components/sidebar/Sidebar"
import { Topbar } from "../components/topbar/Topbar"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      </div>
    </div>
  )
}
