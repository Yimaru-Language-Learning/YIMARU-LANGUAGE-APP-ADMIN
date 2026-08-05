/** Team roles whose JWT maps to ADMIN/SUPER_ADMIN and bypass FAQ permission checks. */
const FAQ_BYPASS_TEAM_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
])

export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}

export function hasFaqRoleBypass(): boolean {
  const role = getSessionTeamRole().toUpperCase()
  return FAQ_BYPASS_TEAM_ROLES.has(role)
}

export function hasFaqPermission(
  permission: string,
  permissions: string[],
): boolean {
  if (hasFaqRoleBypass()) return true
  return permissions.includes(permission)
}
