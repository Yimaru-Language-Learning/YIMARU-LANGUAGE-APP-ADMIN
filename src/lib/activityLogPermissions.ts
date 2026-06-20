const ACTIVITY_LOG_BYPASS_TEAM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}

export function hasActivityLogRoleBypass(): boolean {
  const role = getSessionTeamRole().toUpperCase()
  return ACTIVITY_LOG_BYPASS_TEAM_ROLES.has(role)
}

export function hasActivityLogPermission(
  permission: string,
  permissions: string[],
): boolean {
  if (hasActivityLogRoleBypass()) return true
  return permissions.includes(permission)
}
