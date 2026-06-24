import type { TeamMemberSession } from "../types/auth.types"

const KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  role: "role",
  memberId: "member_id",
} as const

export const TEAM_SESSION_UPDATED_EVENT = "yimaru:team-session-updated"

function dispatchSessionUpdated() {
  window.dispatchEvent(new Event(TEAM_SESSION_UPDATED_EVENT))
}

export function loadTeamSession(): TeamMemberSession | null {
  const access_token = localStorage.getItem(KEYS.accessToken)
  const refresh_token = localStorage.getItem(KEYS.refreshToken)
  const team_role = localStorage.getItem(KEYS.role) ?? ""
  const memberIdRaw = localStorage.getItem(KEYS.memberId)
  if (!access_token || !refresh_token) return null
  const member_id = Number(memberIdRaw)
  if (!Number.isFinite(member_id)) return null
  return { access_token, refresh_token, member_id, team_role }
}

export function saveTeamSession(session: TeamMemberSession): void {
  localStorage.setItem(KEYS.accessToken, session.access_token)
  localStorage.setItem(KEYS.refreshToken, session.refresh_token)
  localStorage.setItem(KEYS.role, session.team_role)
  localStorage.setItem(KEYS.memberId, String(session.member_id))
  dispatchSessionUpdated()
}

export function saveTeamSessionFromLoginResult(result: {
  accessToken: string
  refreshToken: string
  role: string
  memberId: number
}): void {
  saveTeamSession({
    access_token: result.accessToken,
    refresh_token: result.refreshToken,
    team_role: result.role,
    member_id: result.memberId,
  })
}

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.accessToken)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.refreshToken)
}

export function clearTeamSession(): void {
  localStorage.removeItem(KEYS.accessToken)
  localStorage.removeItem(KEYS.refreshToken)
  localStorage.removeItem(KEYS.role)
  localStorage.removeItem(KEYS.memberId)
  dispatchSessionUpdated()
}
