import { Outlet } from "react-router-dom"
import { Sidebar } from "../components/sidebar/Sidebar"
import { Topbar } from "../components/topbar/Topbar"

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-grayScale-100">
      <Sidebar />
      <div className="ml-[264px] flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


