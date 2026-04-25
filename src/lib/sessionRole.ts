const ADMIN_OR_SUPER: ReadonlySet<string> = new Set([
  "admin",
  "super_admin",
]);

/**
 * True when the stored session role is admin or super_admin (login stores `role` in localStorage).
 */
export function isAdminOrSuperAdminRole(): boolean {
  const raw = localStorage.getItem("role");
  if (!raw) return false;
  return ADMIN_OR_SUPER.has(raw.trim().toLowerCase());
}
