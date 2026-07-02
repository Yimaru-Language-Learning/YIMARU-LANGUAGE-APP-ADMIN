import { getEmailTemplates, parseEmailTemplatesResponse } from "../api/emailTemplates.api"
import type { EmailTemplate } from "../types/emailTemplate.types"

const TEMPLATE_LIST_PAGE_SIZE = 100

/** Slugs reserved for automated learner/team flows — shown with a label in the compose UI. */
export const AUTOMATED_EMAIL_TEMPLATE_SLUGS = new Set([
  "otp",
  "invitation",
  "password_reset",
  "welcome",
])

export function isAutomatedEmailTemplateSlug(slug: string): boolean {
  return AUTOMATED_EMAIL_TEMPLATE_SLUGS.has(slug)
}

/** ACTIVE templates available in bulk-email compose. */
export function isComposeEmailTemplate(template: EmailTemplate): boolean {
  return String(template.status ?? "").toUpperCase() === "ACTIVE"
}

/** @deprecated Use isComposeEmailTemplate */
export function isOutboundEmailTemplate(template: EmailTemplate): boolean {
  return isComposeEmailTemplate(template)
}

export function filterComposeEmailTemplates(templates: EmailTemplate[]): EmailTemplate[] {
  return templates.filter(isComposeEmailTemplate)
}

/** @deprecated Use filterComposeEmailTemplates */
export function filterOutboundEmailTemplates(templates: EmailTemplate[]): EmailTemplate[] {
  return filterComposeEmailTemplates(templates)
}

function sortOutboundEmailTemplates(templates: EmailTemplate[]): EmailTemplate[] {
  return [...templates].sort((a, b) => {
    if (a.slug === "custom_message") return -1
    if (b.slug === "custom_message") return 1
    return a.name.localeCompare(b.name)
  })
}

/** Loads all ACTIVE email templates for bulk-email compose. */
export async function fetchActiveOutboundEmailTemplates(): Promise<EmailTemplate[]> {
  const all: EmailTemplate[] = []
  let offset = 0

  while (true) {
    const response = await getEmailTemplates({
      limit: TEMPLATE_LIST_PAGE_SIZE,
      offset,
    })
    const rawPage = parseEmailTemplatesResponse(response)
    if (rawPage.length === 0) break

    all.push(...rawPage)

    const data = response.data?.data
    const totalRaw =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>).total_count ??
          (data as Record<string, unknown>).TotalCount
        : undefined
    const total = totalRaw != null ? Number(totalRaw) : undefined

    offset += rawPage.length
    if (total != null && Number.isFinite(total) && offset >= total) break
    if (rawPage.length < TEMPLATE_LIST_PAGE_SIZE) break
  }

  return sortOutboundEmailTemplates(filterComposeEmailTemplates(all))
}

export function defaultOutboundEmailTemplateSlug(templates: EmailTemplate[]): string {
  const custom = templates.find((t) => t.slug === "custom_message")
  return custom?.slug ?? templates[0]?.slug ?? ""
}

export function isCustomMessageTemplate(slug: string): boolean {
  return slug === "custom_message"
}

export function buildEmailTemplateVariablesForSend(
  slug: string,
  subject: string,
  message: string,
  templateVariables: Record<string, string>,
): Record<string, string> {
  if (isCustomMessageTemplate(slug)) {
    return {
      Subject: subject.trim(),
      Message: message.trim(),
      ...templateVariables,
    }
  }
  return templateVariables
}

export function appendBulkEmailContentToForm(
  form: FormData,
  {
    templateSlug,
    subject,
    message,
    htmlBody,
    templateVariables,
  }: {
    templateSlug: string
    subject: string
    message: string
    htmlBody: string
    templateVariables: Record<string, string>
  },
): void {
  if (templateSlug) {
    form.append("email_template_slug", templateSlug)
    const variables = buildEmailTemplateVariablesForSend(
      templateSlug,
      subject,
      message,
      templateVariables,
    )
    form.append("template_variables", JSON.stringify(variables))
    if (isCustomMessageTemplate(templateSlug)) {
      form.append("subject", subject.trim())
      form.append("message", message.trim())
    }
    return
  }

  form.append("subject", subject.trim())
  if (message.trim()) form.append("message", message.trim())
  if (htmlBody.trim()) form.append("html", htmlBody.trim())
}

export function validateEmailComposeInput({
  templateSlug,
  subject,
  message,
  htmlBody,
  template,
  templateVariables,
}: {
  templateSlug: string
  subject: string
  message: string
  htmlBody: string
  template: EmailTemplate | null
  templateVariables: Record<string, string>
}): string | null {
  if (!templateSlug) {
    if (!subject.trim()) return "Subject is required for free-form email."
    if (!message.trim() && !htmlBody.trim()) {
      return "Message or HTML body is required for free-form email."
    }
    return null
  }

  if (isCustomMessageTemplate(templateSlug)) {
    if (!subject.trim()) return "Subject is required for the custom_message template."
    if (!message.trim()) return "Message is required for the custom_message template."
    return null
  }

  if (!template) return "Select a valid email template."

  for (const variable of template.variables) {
    if (!String(templateVariables[variable] ?? "").trim()) {
      return `Template variable "${variable}" is required.`
    }
  }

  return null
}
