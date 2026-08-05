import type { Role } from "../types/rbac.types"

/** The three assignable staff roles for the admin panel. */
export const STAFF_TEAM_ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CONTENT_MANAGER", label: "Content Manager" },
] as const

export const TEAM_ROLE_OPTIONS = [...STAFF_TEAM_ROLE_OPTIONS]

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
 * Must be one of SUPER_ADMIN, ADMIN, or CONTENT_MANAGER.
 */
export function teamRoleNameForInvite(teamRole: string, explicitName?: string): string {
  const raw = (teamRole || explicitName || "").trim()
  if (!raw) return ""

  const byLabel = TEAM_ROLE_OPTIONS.find(
    (o) => o.label.toLowerCase() === raw.toLowerCase(),
  )
  if (byLabel) return byLabel.value

  const byValue = TEAM_ROLE_OPTIONS.find(
    (o) => o.value === raw || o.value === raw.toUpperCase(),
  )
  if (byValue) return byValue.value

  return rbacRoleNameToTeamRole(raw)
}

export type TeamRoleOption = { value: string; label: string }

export function staffTeamRoleOptions(): TeamRoleOption[] {
  return TEAM_ROLE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))
}

/** @deprecated Custom RBAC team roles are no longer supported; use staffTeamRoleOptions(). */
export function rbacRolesToTeamRoleOptions(roles: Role[]): TeamRoleOption[] {
  void roles
  return staffTeamRoleOptions()
}
