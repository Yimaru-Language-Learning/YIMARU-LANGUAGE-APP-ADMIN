import axios from "axios"
import type { TeamVerifyPasswordResetData } from "../types/team.types"

/** Prefer API `error` detail over generic `message` for auth recovery flows. */
export function getTeamAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>
      if (typeof record.error === "string" && record.error.trim()) {
        return record.error.trim()
      }
      if (typeof record.message === "string" && record.message.trim()) {
        return record.message.trim()
      }
    }
  }
  return fallback
}

export function mapTeamPasswordResetError(error: unknown): string {
  const detail = getTeamAuthErrorMessage(error, "")
  const lower = detail.toLowerCase()

  if (lower.includes("not active")) {
    return "This account is inactive. Contact an administrator."
  }
  if (lower.includes("accept your invitation")) {
    return "Finish accepting your invitation before resetting your password."
  }
  if (lower.includes("not found")) {
    return "No team account found for that email."
  }
  if (lower.includes("expired")) {
    return "This reset link has expired (valid for 5 minutes). Request a new one."
  }
  if (lower.includes("already been used")) {
    return "This reset link was already used. Request a new one."
  }
  if (lower.includes("invalid or missing reset code") || lower.includes("invalid")) {
    return "Invalid reset code. Request a new link from Forgot password."
  }
  if (lower.includes("team_password_reset_base_url")) {
    return "Password reset is not configured. Contact an administrator."
  }
  if (detail) return detail
  return "Something went wrong. Please try again."
}

export function getInvalidResetLinkTitle(
  data: TeamVerifyPasswordResetData | null,
): string {
  switch (data?.reason) {
    case "used":
      return "This reset link was already used"
    case "expired":
      return "This reset link has expired"
    case "missing":
      return "Reset link is incomplete"
    default:
      return "This reset link is invalid"
  }
}

export function getInvalidResetLinkDescription(
  data: TeamVerifyPasswordResetData | null,
): string {
  switch (data?.reason) {
    case "used":
      return "Each reset link can only be used once. Request a new link to set a new password."
    case "expired":
      return "Reset links are valid for 5 minutes. Request a new one to continue."
    case "missing":
      return "Open the full link from your email, or request a new reset link."
    default:
      return "The link may be expired, invalid, or already used. Request a new one from Forgot password."
  }
}
