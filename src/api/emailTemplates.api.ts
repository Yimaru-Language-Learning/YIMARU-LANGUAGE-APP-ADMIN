import http from "./http"
import type {
  CreateEmailTemplateRequest,
  CreateEmailTemplateResponse,
  DeleteEmailTemplateResponse,
  EmailTemplate,
  GetEmailTemplateBySlugResponse,
  GetEmailTemplatesResponse,
  UpdateEmailTemplateRequest,
  UpdateEmailTemplateResponse,
} from "../types/emailTemplate.types"

/** GET /admin/email-templates — list all email templates. */
export const getEmailTemplates = () =>
  http.get<GetEmailTemplatesResponse>("/admin/email-templates")

/** GET /admin/email-templates/slug/:slug — single template by slug. */
export const getEmailTemplateBySlug = (slug: string) =>
  http.get<GetEmailTemplateBySlugResponse>(
    `/admin/email-templates/slug/${encodeURIComponent(slug)}`,
  )

function normalizeEmailTemplate(row: unknown): EmailTemplate | null {
  if (!row || typeof row !== "object" || !("slug" in row)) return null
  const t = row as EmailTemplate
  return {
    ...t,
    variables: Array.isArray(t.variables) ? t.variables : [],
    status: t.status ?? "ACTIVE",
    updated_at: t.updated_at ?? t.created_at ?? "",
  }
}

export function parseEmailTemplatesResponse(
  response: Awaited<ReturnType<typeof getEmailTemplates>>,
): EmailTemplate[] {
  const data = response.data?.data
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.templates)
      ? data.templates
      : []
  return rows
    .map(normalizeEmailTemplate)
    .filter((row): row is EmailTemplate => row != null)
}

/** PUT /admin/email-templates/:id — update subject and bodies. */
export const updateEmailTemplate = (
  id: number,
  data: UpdateEmailTemplateRequest,
) => http.put<UpdateEmailTemplateResponse>(`/admin/email-templates/${id}`, data)

/** POST /admin/email-templates — create a custom template. */
export const createEmailTemplate = (data: CreateEmailTemplateRequest) =>
  http.post<CreateEmailTemplateResponse>("/admin/email-templates", data)

/** DELETE /admin/email-templates/:id — delete a custom template. */
export const deleteEmailTemplate = (id: number) =>
  http.delete<DeleteEmailTemplateResponse>(`/admin/email-templates/${id}`)

export function parseEmailTemplateResponse(
  response:
    | Awaited<ReturnType<typeof getEmailTemplateBySlug>>
    | Awaited<ReturnType<typeof updateEmailTemplate>>
    | Awaited<ReturnType<typeof createEmailTemplate>>,
): EmailTemplate | null {
  return normalizeEmailTemplate(response.data?.data)
}
