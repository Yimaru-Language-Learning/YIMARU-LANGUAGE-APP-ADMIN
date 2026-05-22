const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Parse one or more emails from newline-, comma-, or semicolon-separated input. */
export function parseInviteEmails(text: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const part of text.split(/[\n,;]+/)) {
    const email = part.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    result.push(email)
  }

  return result
}

export function isValidInviteEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

export type InviteEmailSendResult = {
  email: string
  success: boolean
  message: string
  invitationId?: number
}
