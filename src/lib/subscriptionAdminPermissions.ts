import { getNormalizedSessionTeamRole } from "./teamRole"

export const SUBSCRIPTION_ADMIN_PERMISSIONS = {
  /** Unified grant-or-extend (admin_grant removed from API seeds). */
  apply: "subscriptions.admin_extend",
  extend: "subscriptions.admin_extend",
  cancel: "subscriptions.admin_cancel",
  getByUser: "subscriptions.get_by_user",
} as const

const ALL_ADMIN_SUBSCRIPTION_PERMISSIONS = [
  SUBSCRIPTION_ADMIN_PERMISSIONS.apply,
  SUBSCRIPTION_ADMIN_PERMISSIONS.cancel,
  SUBSCRIPTION_ADMIN_PERMISSIONS.getByUser,
] as const

/** Default access by team role (matches API RBAC seeds for ADMIN). */
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  SUPER_ADMIN: ALL_ADMIN_SUBSCRIPTION_PERMISSIONS,
  ADMIN: ALL_ADMIN_SUBSCRIPTION_PERMISSIONS,
}

export function hasSubscriptionAdminPermission(
  permission: string,
  permissions: string[],
): boolean {
  if (permissions.includes(permission)) return true
  const rolePerms = ROLE_PERMISSIONS[getNormalizedSessionTeamRole()]
  return rolePerms?.includes(permission) ?? false
}

const LEARNER_ROLES = new Set(["STUDENT", "OPEN_LEARNER"])

export function isLearnerRole(role: string | null | undefined): boolean {
  return LEARNER_ROLES.has(String(role ?? "").trim().toUpperCase())
}

export function formatAdminPaymentMethod(method: string | null | undefined): string {
  const value = String(method ?? "").trim().toUpperCase()
  if (value === "ADMIN_GRANT") return "Admin grant"
  if (value === "ADMIN_EXTEND") return "Admin extend"
  if (!value) return "—"
  return method!.trim()
}
