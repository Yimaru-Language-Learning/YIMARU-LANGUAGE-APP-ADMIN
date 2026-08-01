import type { VerifyInvitationData } from "../types/teamInvitation.types"

export function formatTeamRoleLabel(role: string | undefined): string {
  if (!role) return "unassigned"
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatInvitationExpiry(raw: string | undefined): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

/** User-facing title when verify returns valid: false. */
export function getInvalidInvitationTitle(data: VerifyInvitationData | null): string {
  const status = data?.status?.toLowerCase() ?? ""
  const message = (data?.message ?? "").toLowerCase()

  if (status === "expired" || message.includes("expir")) {
    return "This invitation has expired"
  }
  if (
    status === "accepted" ||
    message.includes("already") ||
    message.includes("used") ||
    message.includes("accepted")
  ) {
    return "This invitation was already used"
  }
  if (status === "revoked" || message.includes("revok")) {
    return "This invitation was revoked"
  }
  return "This invitation link is invalid"
}

export function getInvalidInvitationDescription(
  data: VerifyInvitationData | null,
  apiMessage?: string,
): string {
  const specific = data?.message?.trim() || apiMessage?.trim()
  if (specific) return specific
  return "The link may be expired, invalid, or already used. Ask your administrator to send a new invitation."
}
