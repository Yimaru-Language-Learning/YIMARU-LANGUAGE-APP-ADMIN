/** Roles that bypass RBAC permission checks per ratings integration guide. */
const RATINGS_BYPASS_TEAM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}

export function hasRatingsRoleBypass(): boolean {
  const role = getSessionTeamRole().toUpperCase()
  return RATINGS_BYPASS_TEAM_ROLES.has(role)
}

export function hasRatingsPermission(
  permission: string,
  permissions: string[],
): boolean {
  if (hasRatingsRoleBypass()) return true
  return permissions.includes(permission)
}
