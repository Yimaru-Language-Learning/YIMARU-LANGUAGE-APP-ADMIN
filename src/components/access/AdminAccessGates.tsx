import type { ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAdminAccess } from "../../hooks/useAdminAccess"

type GateProps = {
  children: ReactNode
  fallback?: ReactNode
}

/** Renders children only for Admin and Super Admin (not Content Manager). */
export function FullPanelOnly({ children, fallback = null }: GateProps) {
  const { hasFullPanel } = useAdminAccess()
  if (!hasFullPanel) return <>{fallback}</>
  return <>{children}</>
}

/** Renders children only for Super Admin (e.g. team email invites). */
export function SuperAdminOnly({ children, fallback = null }: GateProps) {
  const { canInviteTeam } = useAdminAccess()
  if (!canInviteTeam) return <>{fallback}</>
  return <>{children}</>
}

/** Route layout: redirects Content Manager to their home route. */
export function FullPanelGuard() {
  const { hasFullPanel, defaultHome } = useAdminAccess()
  if (!hasFullPanel) {
    return <Navigate to={defaultHome} replace />
  }
  return <Outlet />
}
