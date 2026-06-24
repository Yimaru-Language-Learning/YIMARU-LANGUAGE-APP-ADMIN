import { clearTeamSession } from "./teamAuthStorage"

/** Clear session tokens and redirect to login (full page navigation). */
export function logoutToLogin(options?: { passwordChanged?: boolean }) {
  clearTeamSession()
  const search = options?.passwordChanged ? "?password_changed=1" : ""
  window.location.href = `/login${search}`
}
