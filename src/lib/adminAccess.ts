import { getNormalizedSessionTeamRole } from "./teamRole"

export const FULL_PANEL_TEAM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

/** The three assignable staff roles for the admin panel. */
export const STAFF_TEAM_ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CONTENT_MANAGER", label: "Content Manager" },
] as const

const CONTENT_MANAGER_PATH_PREFIXES = [
  "/new-content",
  "/personas",
  "/profile",
  "/content",
]

export function hasFullAdminPanelAccess(role?: string): boolean {
  const r = (role ?? getNormalizedSessionTeamRole()).toUpperCase()
  return FULL_PANEL_TEAM_ROLES.has(r)
}

export function isContentManagerRole(role?: string): boolean {
  const r = (role ?? getNormalizedSessionTeamRole()).toUpperCase()
  return r === "CONTENT_MANAGER"
}

export function canSendTeamInvitations(role?: string): boolean {
  const r = (role ?? getNormalizedSessionTeamRole()).toUpperCase()
  return r === "SUPER_ADMIN"
}

export function isPathAllowedForTeamRole(pathname: string, role?: string): boolean {
  const r = (role ?? getNormalizedSessionTeamRole()).toUpperCase()
  if (!r || hasFullAdminPanelAccess(r)) return true
  if (isContentManagerRole(r)) {
    return CONTENT_MANAGER_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  }
  return pathname === "/profile" || pathname.startsWith("/profile/")
}

export function getDefaultAppHome(role?: string): string {
  if (isContentManagerRole(role)) return "/new-content"
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
  const r = (role ?? getNormalizedSessionTeamRole()).toUpperCase()
  if (!r || hasFullAdminPanelAccess(r)) return true
  if (!isContentManagerRole(r)) return false

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
