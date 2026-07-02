import http from "./http"
import type {
  CreateEmailTemplateRequest,
  CreateEmailTemplateResponse,
  DeleteEmailTemplateResponse,
  EmailTemplate,
  GetEmailTemplateBySlugResponse,
  GetEmailTemplatesResponse,
  PreviewEmailTemplateResponse,
  PreviewEmailTemplateResult,
  UpdateEmailTemplateRequest,
  UpdateEmailTemplateResponse,
} from "../types/emailTemplate.types"

export interface GetEmailTemplatesParams {
  status?: string
  limit?: number
  offset?: number
  query?: string
}

/** GET /admin/email-templates — list email templates (paginated). */
export const getEmailTemplates = (params?: GetEmailTemplatesParams) =>
  http.get<GetEmailTemplatesResponse>("/admin/email-templates", { params })

/** GET /admin/email-templates/slug/:slug — single template by slug. */
export const getEmailTemplateBySlug = (slug: string) =>
  http.get<GetEmailTemplateBySlugResponse>(
    `/admin/email-templates/slug/${encodeURIComponent(slug)}`,
  )

function normalizeEmailTemplate(row: unknown): EmailTemplate | null {
  if (!row || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  const slug = String(o.slug ?? o.Slug ?? "").trim()
  if (!slug) return null

  const id = Number(o.id ?? o.ID ?? o.Id)
  const variablesRaw = o.variables ?? o.Variables
  const variables = Array.isArray(variablesRaw)
    ? variablesRaw.map((v) => String(v).trim()).filter(Boolean)
    : []

  return {
    id: Number.isFinite(id) && id > 0 ? id : 0,
    slug,
    name: String(o.name ?? o.Name ?? slug),
    subject: String(o.subject ?? o.Subject ?? ""),
    body_text: String(o.body_text ?? o.BodyText ?? o.bodyText ?? ""),
    body_html: String(o.body_html ?? o.BodyHtml ?? o.bodyHTML ?? ""),
    variables,
    is_system: Boolean(o.is_system ?? o.IsSystem ?? false),
    status: String(o.status ?? o.Status ?? "ACTIVE"),
    created_at: String(o.created_at ?? o.CreatedAt ?? ""),
    updated_at: String(o.updated_at ?? o.UpdatedAt ?? o.created_at ?? o.CreatedAt ?? ""),
  }
}

function extractTemplateRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []
  const record = data as Record<string, unknown>
  const candidates = [
    record.templates,
    record.Templates,
    record.email_templates,
    record.EmailTemplates,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

export function parseEmailTemplatesResponse(
  response: Awaited<ReturnType<typeof getEmailTemplates>>,
): EmailTemplate[] {
  const data = response.data?.data
  return extractTemplateRows(data)
    .map(normalizeEmailTemplate)
    .filter((row): row is EmailTemplate => row != null && row.id > 0)
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

/** POST /admin/email-templates/slug/:slug/preview — render without sending. */
export const previewEmailTemplate = (
  slug: string,
  variables: Record<string, string>,
) =>
  http.post<PreviewEmailTemplateResponse>(
    `/admin/email-templates/slug/${encodeURIComponent(slug)}/preview`,
    { variables },
  )

function parsePreviewResult(body: unknown): PreviewEmailTemplateResult | null {
  if (!body || typeof body !== "object") return null
  const envelope = body as { data?: unknown }
  const inner = envelope.data ?? body
  if (!inner || typeof inner !== "object") return null
  const row = inner as Record<string, unknown>
  return {
    subject: String(row.subject ?? ""),
    text: String(row.text ?? row.body_text ?? ""),
    html: String(row.html ?? row.body_html ?? ""),
  }
}

export function parseEmailTemplatePreviewResponse(
  response: Awaited<ReturnType<typeof previewEmailTemplate>>,
): PreviewEmailTemplateResult | null {
  return parsePreviewResult(response.data)
}

export function parseEmailTemplateResponse(
  response:
    | Awaited<ReturnType<typeof getEmailTemplateBySlug>>
    | Awaited<ReturnType<typeof updateEmailTemplate>>
    | Awaited<ReturnType<typeof createEmailTemplate>>,
): EmailTemplate | null {
  return normalizeEmailTemplate(response.data?.data)
}
