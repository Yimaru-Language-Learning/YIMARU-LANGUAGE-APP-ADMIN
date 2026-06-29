import { getAccessToken } from "./teamAuthStorage"
import { rbacRoleNameToTeamRole } from "./teamRoles"

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}

/** Canonical team role key (e.g. ADMIN) for RBAC checks. */
export function getNormalizedSessionTeamRole(): string {
  const stored = getSessionTeamRole()
  if (stored) return rbacRoleNameToTeamRole(stored)

  const token = getAccessToken()
  if (!token) return ""

  const payload = decodeJwtPayload(token)
  const fromJwt = payload?.team_role ?? payload?.role
  if (typeof fromJwt === "string" && fromJwt.trim()) {
    return rbacRoleNameToTeamRole(fromJwt)
  }

  return ""
}

export function syncSessionTeamRole(teamRole: string | undefined | null): void {
  const next = teamRole?.trim()
  if (!next) return
  localStorage.setItem("role", next)
}
