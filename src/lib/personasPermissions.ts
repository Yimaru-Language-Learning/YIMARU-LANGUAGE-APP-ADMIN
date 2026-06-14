const PERSONAS_BYPASS_TEAM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}

export function hasPersonasRoleBypass(): boolean {
  const role = getSessionTeamRole().toUpperCase()
  return PERSONAS_BYPASS_TEAM_ROLES.has(role)
}

export function hasPersonaPermission(
  permission: string,
  permissions: string[],
): boolean {
  if (hasPersonasRoleBypass()) return true
  return permissions.includes(permission)
}
