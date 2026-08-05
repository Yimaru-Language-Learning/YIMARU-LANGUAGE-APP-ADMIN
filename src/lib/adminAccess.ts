import { getNormalizedSessionTeamRole } from "./teamRole"

export const FULL_PANEL_TEAM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

const CONTENT_MANAGER_PATH_PREFIXES = [
  "/new-content",
  "/personas",
  "/profile",
  "/content",
]

function normalizedTeamRole(role?: string): string {
  return (role ?? getNormalizedSessionTeamRole()).toUpperCase()
}

/** Only Content Manager gets a reduced admin panel; all other roles keep full navigation. */
export function isContentManagerPanelRole(role?: string): boolean {
  return normalizedTeamRole(role) === "CONTENT_MANAGER"
}

export function hasFullAdminPanelAccess(role?: string): boolean {
  const r = normalizedTeamRole(role)
  if (!r) return true
  return !isContentManagerPanelRole(r)
}

export function isContentManagerRole(role?: string): boolean {
  return isContentManagerPanelRole(role)
}

export function canSendTeamInvitations(role?: string): boolean {
  return normalizedTeamRole(role) === "SUPER_ADMIN"
}

export function isPathAllowedForTeamRole(pathname: string, role?: string): boolean {
  if (!isContentManagerPanelRole(role)) return true
  return CONTENT_MANAGER_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function getDefaultAppHome(role?: string): string {
  if (isContentManagerPanelRole(role)) return "/new-content"
  return "/dashboard"
}

export type NavEntryKind = "section" | "link" | "group"

export type FilterableNavEntry = {
  kind: NavEntryKind
  label: string
  to?: string
  basePath?: string
}

/** Sidebar entries visible to content managers (learning content + profile). */
export function isNavEntryAllowedForTeamRole(
  entry: FilterableNavEntry,
  role?: string,
): boolean {
  if (!isContentManagerPanelRole(role)) return true

  if (entry.kind === "section") {
    return entry.label === "Learning content" || entry.label === "Account"
  }
  if (entry.kind === "group") {
    return entry.basePath === "/new-content"
  }
  if (entry.kind === "link") {
    return entry.to === "/personas" || entry.to === "/profile"
  }
  return false
}
