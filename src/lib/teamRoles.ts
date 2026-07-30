import type { Role } from "../types/rbac.types"

export const TEAM_ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CONTENT_MANAGER", label: "Content Manager" },
  { value: "SUPPORT_AGENT", label: "Support Agent" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "FINANCE", label: "Finance" },
  { value: "HR", label: "HR" },
  { value: "ANALYST", label: "Analyst" },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contractor", label: "Contractor" },
  { value: "intern", label: "Intern" },
] as const

/** Map RBAC role display name to API team_role (e.g. CONTENT_MANAGER). */
export function rbacRoleNameToTeamRole(roleName: string): string {
  const normalized = roleName.trim().toUpperCase().replace(/[\s-]+/g, "_")
  const byValue = TEAM_ROLE_OPTIONS.find((o) => o.value === normalized)
  if (byValue) return byValue.value
  const byLabel = TEAM_ROLE_OPTIONS.find(
    (o) => o.label.toUpperCase().replace(/[\s-]+/g, "_") === normalized,
  )
  if (byLabel) return byLabel.value
  return normalized
}

export function teamRoleFromRbacRole(role: Role): string {
  return rbacRoleNameToTeamRole(role.name)
}

export function formatTeamRoleLabel(teamRole: string): string {
  const found = TEAM_ROLE_OPTIONS.find(
    (o) => o.value === teamRole || o.value === teamRole.toUpperCase(),
  )
  if (found) return found.label
  return teamRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Role key/name sent to POST /team/members/invite.
 * Must be a built-in team role (e.g. SUPER_ADMIN) or an exact RBAC role name/id —
 * never a UI display label like "Super Admin".
 */
export function teamRoleNameForInvite(teamRole: string, explicitName?: string): string {
  const raw = (teamRole || explicitName || "").trim()
  if (!raw) return ""

  // Accidental display labels from built-in options → API keys
  const byLabel = TEAM_ROLE_OPTIONS.find(
    (o) => o.label.toLowerCase() === raw.toLowerCase(),
  )
  if (byLabel) return byLabel.value

  const byValue = TEAM_ROLE_OPTIONS.find(
    (o) => o.value === raw || o.value === raw.toUpperCase(),
  )
  if (byValue) return byValue.value

  // Custom RBAC roles: keep exact name (spaces allowed); numeric id strings pass through
  return raw
}

export type TeamRoleOption = { value: string; label: string }

export function rbacRolesToTeamRoleOptions(roles: Role[]): TeamRoleOption[] {
  const names = Array.from(
    new Set(roles.map((role) => role.name.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  return names.map((name) => ({
    value: name,
    label: formatTeamRoleLabel(name),
  }))
}
