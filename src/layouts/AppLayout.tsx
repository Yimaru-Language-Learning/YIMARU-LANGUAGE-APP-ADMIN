import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "../components/sidebar/Sidebar"
import { Topbar } from "../components/topbar/Topbar"
import { getAccessToken } from "../lib/teamAuthStorage"
import {
  getDefaultAppHome,
  isPathAllowedForTeamRole,
} from "../lib/adminAccess"
import { getNormalizedSessionTeamRole } from "../lib/teamRole"
import {
  connectNotificationsWebSocket,
  disconnectNotificationsWebSocket,
} from "../lib/notificationsWebSocket"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const mainRef = useRef<HTMLElement | null>(null)
  const previousRouteKeyRef = useRef<string>("")
  const location = useLocation()
  const scrollStoragePrefix = "app:scroll:"
  const routeKey = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search])

  const token = getAccessToken()

  useEffect(() => {
    if (!token) return
    connectNotificationsWebSocket()
    return () => disconnectNotificationsWebSocket()
  }, [token])

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    const container = mainRef.current
    if (!container) return

    const saveScroll = (key: string) => {
      sessionStorage.setItem(`${scrollStoragePrefix}${key}`, String(container.scrollTop || 0))
    }

    const previousKey = previousRouteKeyRef.current
    if (previousKey && previousKey !== routeKey) {
      saveScroll(previousKey)
    }
    previousRouteKeyRef.current = routeKey

    const restoreRaw = sessionStorage.getItem(`${scrollStoragePrefix}${routeKey}`)
    const restoreTop = restoreRaw ? Number(restoreRaw) : 0
    const top = Number.isFinite(restoreTop) && restoreTop > 0 ? restoreTop : 0
    requestAnimationFrame(() => {
      container.scrollTo({ top, behavior: "auto" })
    })

    const onScroll = () => saveScroll(routeKey)
    const onBeforeUnload = () => saveScroll(routeKey)
    container.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      saveScroll(routeKey)
      container.removeEventListener("scroll", onScroll)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [routeKey])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const teamRole = getNormalizedSessionTeamRole()
  if (!isPathAllowedForTeamRole(location.pathname, teamRole)) {
    return <Navigate to={getDefaultAppHome(teamRole)} replace />
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-grayScale-100">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={handleSidebarClose}
      />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[264px]"
        }`}
      >
        <Topbar onSidebarToggle={handleSidebarToggle} />
        <main
          ref={mainRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 pb-8 pt-4 sm:px-4 lg:px-6"
        >
          <Outlet />
        </main>
        <footer className="shrink-0 border-t bg-grayScale-50 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-grayScale-400">
            <span>Powered by</span>
            <a
              href="https://yimaruacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-500 transition-colors hover:text-brand-600"
            >
              Yimaru Academy
            </a>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
