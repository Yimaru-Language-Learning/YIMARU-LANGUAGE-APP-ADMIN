import { getSessionTeamRole } from "./teamRole"

const ALL_EXPORT_PERMISSIONS = [
  "payments.export",
  "users.export",
  "subscriptions.export",
  "activity_logs.export",
  "team.members.export",
] as const

/** Default export access by team role (matches API RBAC seeds). */
const EXPORT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  SUPER_ADMIN: ALL_EXPORT_PERMISSIONS,
  ADMIN: ALL_EXPORT_PERMISSIONS,
  FINANCE: ["payments.export", "subscriptions.export"],
  HR: ["users.export", "team.members.export"],
}

export function hasExportPermission(permission: string, permissions: string[]): boolean {
  if (permissions.includes(permission)) return true
  const rolePerms = EXPORT_ROLE_PERMISSIONS[getSessionTeamRole().toUpperCase()]
  return rolePerms?.includes(permission) ?? false
}
