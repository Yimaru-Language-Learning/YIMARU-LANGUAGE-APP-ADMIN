import { STAFF_TEAM_ROLE_OPTIONS } from "./teamRoles"

/** System roles hidden from Role Management (retained in RBAC for legacy assignments). */
const ROLES_HIDDEN_FROM_MANAGEMENT = new Set(["INSTRUCTOR", "SUPPORT"])

const USER_RBAC_ROLE_NAMES = new Set(["STUDENT", "OPEN_LEARNER"])

const TEAM_RBAC_ROLE_NAMES = new Set(
  STAFF_TEAM_ROLE_OPTIONS.map((o) => o.value.toUpperCase()),
)

export type RoleManagementCategory = "team" | "user"

export function normalizeRbacRoleName(name: string): string {
  return name.trim().toUpperCase().replace(/[\s-]+/g, "_")
}

export function isRoleHiddenFromManagement(name: string): boolean {
  return ROLES_HIDDEN_FROM_MANAGEMENT.has(normalizeRbacRoleName(name))
}

export function isTeamMemberRbacRole(name: string): boolean {
  return TEAM_RBAC_ROLE_NAMES.has(normalizeRbacRoleName(name))
}

export function isUserRbacRole(name: string): boolean {
  return USER_RBAC_ROLE_NAMES.has(normalizeRbacRoleName(name))
}

export function matchesRoleManagementCategory(
  name: string,
  category: RoleManagementCategory,
): boolean {
  if (isRoleHiddenFromManagement(name)) return false
  if (category === "team") return isTeamMemberRbacRole(name)
  return isUserRbacRole(name)
}
