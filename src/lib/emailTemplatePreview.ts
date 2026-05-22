const SAMPLE_VALUES: Record<string, string> = {
  OTP: "123456",
  FirstName: "Alex",
  ExpiresMinutes: "10",
  ResetLink: "https://app.yimaruacademy.com/reset?token=sample",
  InviteLink: "https://app.yimaruacademy.com/invite?token=sample",
  InviterName: "Jordan Admin",
  LoginURL: "https://app.yimaruacademy.com/login",
  Subject: "Sample announcement subject",
  Message:
    "This is sample body text shown in the admin preview. Replace variables when sending real emails.",
}

function sampleForVariable(name: string) {
  return SAMPLE_VALUES[name] ?? `[${name}]`
}

/** Best-effort preview: substitutes `{{.Var}}` and unwraps simple `{{if .Var}}...{{end}}` blocks. */
export function renderEmailTemplatePreview(
  source: string,
  variables: string[],
): string {
  let result = source
  for (const variable of variables) {
    const sample = sampleForVariable(variable)
    result = result.split(`{{.${variable}}}`).join(sample)
    const ifBlock = new RegExp(
      `\\{\\{if \\.${variable}\\}\\}([\\s\\S]*?)\\{\\{end\\}\\}`,
      "g",
    )
    result = result.replace(ifBlock, "$1")
  }
  return result
}

export function formatEmailTemplateDate(raw: string | null | undefined) {
  if (raw == null || String(raw).trim() === "") {
    return "—"
  }
  const text = String(raw)
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return text.split(" +")[0]?.trim() || text
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function emailTemplateStatusBadgeVariant(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === "ACTIVE") return "success" as const
  if (normalized === "INACTIVE") return "secondary" as const
  return "info" as const
}
