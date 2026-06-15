import type { EmailTemplate } from "../types/emailTemplate.types"

/** Reserved for automated learner/team flows — not for admin outbound campaigns. */
export const AUTOMATED_EMAIL_TEMPLATE_SLUGS = new Set([
  "otp",
  "invitation",
  "password_reset",
  "welcome",
])

export function isOutboundEmailTemplate(template: EmailTemplate): boolean {
  if (String(template.status ?? "").toUpperCase() !== "ACTIVE") return false
  if (AUTOMATED_EMAIL_TEMPLATE_SLUGS.has(template.slug)) return false
  return template.slug === "custom_message" || !template.is_system
}

export function filterOutboundEmailTemplates(templates: EmailTemplate[]): EmailTemplate[] {
  return templates.filter(isOutboundEmailTemplate)
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
