/** Clear session tokens and redirect to login (full page navigation). */
export function logoutToLogin(options?: { passwordChanged?: boolean }) {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("member_id")
  localStorage.removeItem("role")
  const search = options?.passwordChanged ? "?password_changed=1" : ""
  window.location.href = `/login${search}`
}
